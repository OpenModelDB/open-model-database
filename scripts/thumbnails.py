from __future__ import annotations
from dataclasses import dataclass
from functools import lru_cache
import math
from pathlib import Path
from typing import Any, Literal, NewType, TypedDict, Union
import json
import importlib.util
from hashlib import sha256
import sys
import os
import time
import zipfile
from multiprocessing.pool import ThreadPool


# install dependencies
def is_installed(*packages: str) -> bool:
    return all(importlib.util.find_spec(package) is not None for package in packages)


if not is_installed("typing_extensions", "cv2", "numpy", "requests"):
    pip_command = "pip install typing-extensions opencv-python numpy requests"
    print(pip_command)
    os.system(sys.executable + " -m " + pip_command)

from typing_extensions import NotRequired  # noqa: E402
import cv2  # noqa: E402
import numpy as np  # noqa: E402
import requests  # noqa: E402

# config
MODEL_FILES_DIR = Path("data/models/")

CACHE_DIR = Path(".thumb-cache/")
IMAGE_DOWNLOAD_DIR = CACHE_DIR / "images/"
CACHE_THUMBNAIL_DIR = CACHE_DIR / "thumbs/"
CACHE_IMAGE_METADATA_JSON = CACHE_THUMBNAIL_DIR / "_image-metadata.json"

THUMBNAIL_DIR = Path("public/thumbs/")
IMAGE_METADATA_JSON = THUMBNAIL_DIR / "_image-metadata.json"

# The following are measured from the model card on the OMDB website.
WEBSITE_MIN_WIDTH = 266
WEBSITE_MIN_HEIGHT = 154
WEBSITE_MAX_WIDTH = 549
WEBSITE_MAX_HEIGHT = 222
# 275 and 222 are measured from the website. It's the little thumbnail window at 100% DPI.
# The 1.33 is a DPI scale factor, so devices with higher DPI will get a larger thumbnail.
CROP_SIZE = (
    math.ceil(math.ceil(WEBSITE_MAX_WIDTH / 2) * 1.33),
    math.ceil(WEBSITE_MAX_HEIGHT * 1.33),
)
COVER_MAX_WIDTH = WEBSITE_MAX_WIDTH
COVER_MAX_RATIO = WEBSITE_MAX_WIDTH / WEBSITE_MIN_HEIGHT
COVER_MIN_RATIO = WEBSITE_MIN_WIDTH / WEBSITE_MAX_HEIGHT

ModelId = NewType("ModelId", str)


class Model(TypedDict):
    name: str
    scale: int
    images: list[Image]
    thumbnail: NotRequired[Thumbnail]


class PairedImage(TypedDict):
    type: Literal["paired"]
    LR: str
    SR: str
    thumbnail: NotRequired[str]


class StandaloneImage(TypedDict):
    type: Literal["standalone"]
    url: str
    thumbnail: NotRequired[str]


Image = Union[PairedImage, StandaloneImage]


class PairedThumbnail(TypedDict):
    type: Literal["paired"]
    LR: str
    SR: str
    LRSize: NotRequired[ImageSize]
    SRSize: NotRequired[ImageSize]


Thumbnail = Union[PairedThumbnail, StandaloneImage]


class ImageSize(TypedDict):
    width: int
    height: int


def download_file(url: str, file: Path, log: bool = True) -> None:
    """Download from url and save to file"""

    if log:
        print(f"Downloading {url}", flush=True)
    response = requests.get(url)
    response.raise_for_status()
    file.parent.mkdir(parents=True, exist_ok=True)
    with file.open("wb") as f:
        f.write(response.content)


def download_json(url: str) -> Any:
    """Download json from url"""

    response = requests.get(url)
    response.raise_for_status()
    return response.json()


def restore_cache():
    if CACHE_THUMBNAIL_DIR.exists():
        return

    print("Restoring cache", flush=True)

    zip_path = CACHE_DIR / "thumbs.zip"
    try:
        download_file(
            "https://github.com/OpenModelDB/auxiliary/releases/download/thumbnails/thumbs.zip",
            zip_path,
        )
    except Exception as e:
        print(f"Failed to download cache: {e}")
        return

    try:
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(CACHE_DIR)
    finally:
        zip_path.unlink(missing_ok=True)


def update_cache():
    print("Updating cache", flush=True)

    # Copy all images from THUMBNAIL_DIR to CACHE_THUMBNAIL_DIR
    CACHE_THUMBNAIL_DIR.mkdir(parents=True, exist_ok=True)
    for file in THUMBNAIL_DIR.glob("**/*"):
        target = CACHE_THUMBNAIL_DIR / file.relative_to(THUMBNAIL_DIR)
        if (
            file.is_file()
            and not target.exists()
            and file.suffix in (".jpg", ".jpeg", ".png")
        ):
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(file.read_bytes())

    # merge _image-metadata.json
    old_data = get_cached_image_metadata()
    current_data = json.loads(IMAGE_METADATA_JSON.read_text(encoding="utf-8"))
    old_data.update(current_data)
    CACHE_IMAGE_METADATA_JSON.write_text(
        json.dumps(old_data, indent=2), encoding="utf-8"
    )


class CachedImageMetadata(TypedDict):
    width: int
    height: int


@lru_cache()
def get_cached_image_metadata() -> dict[str, CachedImageMetadata]:
    def from_file(file: Path) -> dict[str, CachedImageMetadata]:
        if file.exists():
            return json.loads(file.read_text(encoding="utf-8"))
        return {}

    def from_url(url: str) -> dict[str, CachedImageMetadata]:
        try:
            return download_json(url)
        except:  # noqa: E722
            return {}

    result: dict[str, CachedImageMetadata] = {}

    result.update(from_url("https://openmodeldb.info/thumbs/_image-metadata.json"))
    result.update(from_file(CACHE_IMAGE_METADATA_JSON))
    result.update(from_file(IMAGE_METADATA_JSON))

    return result


def save_cached_image_metadata(images: dict[str, ImageMetadata]):
    data: dict[str, CachedImageMetadata] = {}
    for image in images.values():
        data[image.url] = {
            "width": image.width,
            "height": image.height,
        }
    IMAGE_METADATA_JSON.parent.mkdir(parents=True, exist_ok=True)
    IMAGE_METADATA_JSON.write_text(json.dumps(data, indent=2), encoding="utf-8")


def get_current_models() -> dict[ModelId, Model]:
    models: dict[ModelId, Model] = {}
    for file in MODEL_FILES_DIR.glob("*.json"):
        model_id = ModelId(file.stem)
        model: Model = json.loads(file.read_text(encoding="utf-8"))
        models[model_id] = model
    return models


def sha256_str(s: str) -> str:
    return sha256(s.encode("utf-8")).hexdigest().lower()


@dataclass
class ImageMetadata:
    url: str
    width: int
    height: int

    @property
    def ext(self) -> str:
        """E.g. "jpg" or "png" """
        return self.url.split(".")[-1].lower().replace("jpeg", "jpg")

    @property
    def unique_name(self) -> str:
        return sha256_str(self.url)[:16] + "." + self.ext

    @property
    def file(self) -> Path:
        return IMAGE_DOWNLOAD_DIR / self.unique_name

    @property
    def size(self) -> tuple[int, int]:
        return self.width, self.height

    def load(self) -> np.ndarray:
        if not self.file.exists():
            download_file(self.url, self.file)

        img = cv2.imread(str(self.file), cv2.IMREAD_UNCHANGED)

        # as uint8
        if img.dtype == np.uint16:
            img = (img.astype(np.float32) / 257).round().astype(np.uint8)
        if img.dtype == np.float32 or img.dtype == np.float64:
            img = (img * 255).round().astype(np.uint8)

        if img.ndim == 3:
            # remove alpha channel
            if img.shape[2] == 4:
                img = (
                    (
                        img[:, :, :3].astype(np.float32)
                        * img[:, :, 3:4].astype(np.float32)
                        / 255
                    )
                    .round()
                    .astype(np.uint8)
                )

            # convert to grayscale if possible
            if img.shape[2] == 3:
                if np.all(img[:, :, 0] == img[:, :, 1]) and np.all(
                    img[:, :, 1] == img[:, :, 2]
                ):
                    img = img[:, :, 0]

        return img


def get_images(models: dict[ModelId, Model]) -> dict[str, ImageMetadata]:
    images: dict[str, ImageMetadata] = {}
    for model in models.values():
        if len(model["images"]) == 0:
            continue

        # small thumbnails
        for image in model["images"]:
            if image["type"] == "paired":
                # we only use the LR image for small thumbnails
                images[image["LR"]] = ImageMetadata(image["LR"], 0, 0)
            elif image["type"] == "standalone":
                images[image["url"]] = ImageMetadata(image["url"], 0, 0)

        # thumbnail
        image = model["images"][0]
        if image["type"] == "paired":
            images[image["LR"]] = ImageMetadata(image["LR"], 0, 0)
            images[image["SR"]] = ImageMetadata(image["SR"], 0, 0)
        elif image["type"] == "standalone":
            images[image["url"]] = ImageMetadata(image["url"], 0, 0)

    cache = get_cached_image_metadata()
    for image in list(images.values()):
        cached = cache.get(image.url)
        if cached is not None:
            image.width = cached["width"]
            image.height = cached["height"]
        else:
            try:
                image.height, image.width = image.load().shape[:2]
            except:  # noqa: E722
                print(f"Failed to load {image.url}")
                del images[image.url]

    return images


def reuse_thumbnail(thumbnail_name: str) -> bool:
    file = THUMBNAIL_DIR / thumbnail_name
    if file.exists():
        # file exists locally
        return True

    cached_file = CACHE_THUMBNAIL_DIR / thumbnail_name
    if cached_file.exists():
        # copy from cache
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(cached_file.read_bytes())
        return True

    try:
        # file exists on server
        download_file(
            f"https://openmodeldb.info/thumbs/{thumbnail_name}", file, log=False
        )
        return True
    except:  # noqa: E722
        pass

    return False


@dataclass
class Region:
    x: int
    y: int
    w: int
    h: int

    @property
    def size(self) -> tuple[int, int]:
        return self.w, self.h

    def scale(self, scale: int) -> Region:
        return Region(
            x=self.x * scale,
            y=self.y * scale,
            w=self.w * scale,
            h=self.h * scale,
        )

    def __str__(self) -> str:
        return f"Region(x={self.x}, y={self.y}, w={self.w}, h={self.h})"


@dataclass
class ThumbnailResult:
    name: str
    width: int
    height: int


def encode_png(img: np.ndarray) -> bytes:
    params = [cv2.IMWRITE_PNG_COMPRESSION, 9]
    return cv2.imencode("foo.png", img, params)[1].tobytes()


def encode_jpeg(img: np.ndarray, *, quality: int) -> bytes:
    params = [
        cv2.IMWRITE_JPEG_QUALITY,
        quality,
        cv2.IMWRITE_JPEG_PROGRESSIVE,
        1,
        cv2.IMWRITE_JPEG_OPTIMIZE,
        1,
    ]
    return cv2.imencode("foo.jpg", img, params)[1].tobytes()


def encode_image(img: np.ndarray, name: str):
    if name.endswith(".png"):
        return encode_png(img)
    if name.endswith(".jpg") or name.endswith(".jpeg"):
        return encode_jpeg(img, quality=90)
    raise ValueError("Unsupported image format")


def get_lr_crop(size: tuple[int, int], scale: int) -> Region:
    w, h = size
    target_w, target_h = CROP_SIZE[0], CROP_SIZE[1]
    target_w = math.ceil(target_w / scale)
    target_h = math.ceil(target_h / scale)
    return Region(
        x=max(0, (w - target_w) // 2),
        y=max(0, (h - target_h) // 2),
        w=min(w, target_w),
        h=min(h, target_h),
    )


def save_thumbnail(thumbnail_name: str, data: bytes):
    file = THUMBNAIL_DIR / thumbnail_name
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_bytes(data)


def save_thumbnail_crop(
    image: ImageMetadata, crop: Region, ext: Literal[".jpg", ".png"]
) -> ThumbnailResult:
    thumbnail_name = sha256_str(f"crop:{crop}:{image.url}")[:24] + ext
    result = ThumbnailResult(thumbnail_name, width=crop.w, height=crop.h)

    if reuse_thumbnail(thumbnail_name):
        return result

    img = image.load()
    img = img[crop.y : crop.y + crop.h, crop.x : crop.x + crop.w]
    buffer = encode_image(img, thumbnail_name)

    if (
        image.size == crop.size
        and ext == ".jpg"
        and image.ext == ext[1:]
        and image.file.stat().st_size < len(buffer)
    ):
        # just use the original
        buffer = image.file.read_bytes()

    save_thumbnail(thumbnail_name, buffer)
    return result


def save_thumbnail_resize(
    image: ImageMetadata, crop_size: tuple[int, int], resize_size: tuple[int, int]
) -> ThumbnailResult:
    thumbnail_name = (
        sha256_str(f"resize:{crop_size}:{resize_size}:{image.url}")[:24] + ".jpg"
    )
    result = ThumbnailResult(
        thumbnail_name, width=resize_size[0], height=resize_size[1]
    )

    if reuse_thumbnail(thumbnail_name):
        return result

    img = image.load()
    if crop_size != image.size:
        y = (image.height - crop_size[1]) // 2
        x = (image.width - crop_size[0]) // 2
        img = img[y : y + crop_size[1], x : x + crop_size[0]]
    img = cv2.resize(img, resize_size, interpolation=cv2.INTER_AREA)
    buffer = encode_image(img, thumbnail_name)

    if (
        image.size == resize_size
        and image.ext == "jpg"
        and image.file.stat().st_size < len(buffer)
    ):
        # just use the original
        buffer = image.file.read_bytes()

    save_thumbnail(thumbnail_name, buffer)
    return result


def save_thumbnail_lr(image: ImageMetadata, scale: int) -> ThumbnailResult:
    crop = get_lr_crop(image.size, scale)
    ext = ".jpg" if scale == 1 else ".png"
    return save_thumbnail_crop(image, crop, ext)


def save_thumbnail_sr(image: ImageMetadata, scale: int) -> ThumbnailResult:
    crop = get_lr_crop((image.width // scale, image.height // scale), scale).scale(
        scale
    )
    return save_thumbnail_crop(image, crop, ".jpg")


def save_thumbnail_standalone(image: ImageMetadata) -> ThumbnailResult:
    crop_size = image.size

    ratio = image.width / image.height
    if ratio > COVER_MAX_RATIO:
        crop_size = math.ceil(image.height * COVER_MAX_RATIO), image.height
    elif ratio < COVER_MIN_RATIO:
        crop_size = image.width, math.ceil(image.width / COVER_MIN_RATIO)

    resize_size = crop_size
    if resize_size[0] > COVER_MAX_WIDTH:
        scale = COVER_MAX_WIDTH / resize_size[0]
        resize_size = COVER_MAX_WIDTH, math.ceil(resize_size[1] * scale)
    return save_thumbnail_resize(image, crop_size, resize_size)


def save_small_thumbnail(image: ImageMetadata) -> ThumbnailResult:
    TARGET_SIZE = 72

    def resize_to_target_size() -> tuple[int, int]:
        w, h = image.size
        if w <= TARGET_SIZE and h <= TARGET_SIZE:
            return w, h
        if w == h:
            return TARGET_SIZE, TARGET_SIZE
        if w > h:
            return TARGET_SIZE, max(1, round(h * TARGET_SIZE / w))
        return max(1, round(w * TARGET_SIZE / h)), TARGET_SIZE

    resize_size = resize_to_target_size()

    thumbnail_name = "small/" + (
        sha256_str(f"small:{resize_size}:{image.url}")[:24] + ".jpg"
    )
    result = ThumbnailResult(
        thumbnail_name, width=resize_size[0], height=resize_size[1]
    )

    if reuse_thumbnail(thumbnail_name):
        return result

    img = image.load()
    img = cv2.resize(img, resize_size, interpolation=cv2.INTER_AREA)
    buffer = encode_jpeg(img, quality=60)

    if (
        image.size == resize_size
        and image.ext == "jpg"
        and image.file.stat().st_size < len(buffer)
    ):
        # just use the original
        buffer = image.file.read_bytes()

    save_thumbnail(thumbnail_name, buffer)
    return result


def process_model(model_id: ModelId, model: Model, images: dict[str, ImageMetadata]):
    if len(model["images"]) == 0:
        return

    print(f"Processing {model_id}", flush=True)

    # thumbnail
    image = model["images"][0]
    if image["type"] == "paired":
        lr_url = image["LR"]
        sr_url = image["SR"]

        thumb: PairedThumbnail = {"type": "paired", "LR": lr_url, "SR": sr_url}
        model["thumbnail"] = thumb

        if lr_url in images and sr_url in images:
            lr, sr = images[lr_url], images[sr_url]
            # LR-SR pairs sometimes don't follow the scale factor, so it's better to calculate a scale for the pair instead of using the model scale.
            scale = round(sr.width / lr.width)

            if lr.size == sr.size:
                lr_result = save_thumbnail_sr(lr, scale)
                sr_result = save_thumbnail_sr(sr, scale)
            else:
                lr_result = save_thumbnail_lr(lr, scale)
                sr_result = save_thumbnail_sr(sr, scale)

            thumb["LR"] = "/thumbs/" + lr_result.name
            thumb["SR"] = "/thumbs/" + sr_result.name
            thumb["LRSize"] = {"width": lr_result.width, "height": lr_result.height}
            thumb["SRSize"] = {"width": sr_result.width, "height": sr_result.height}
    elif image["type"] == "standalone":
        url = image["url"]
        if url in images:
            url = "/thumbs/" + save_thumbnail_standalone(images[url]).name

        model["thumbnail"] = {"type": "standalone", "url": url}

    # small thumbnails
    for image in model["images"]:
        if image["type"] == "paired":
            lr_url = image["LR"]
            if lr_url in images:
                lr = images[lr_url]
                image["thumbnail"] = "/thumbs/" + save_small_thumbnail(lr).name
        elif image["type"] == "standalone":
            url = image["url"]
            if url in images:
                image["thumbnail"] = "/thumbs/" + save_small_thumbnail(images[url]).name

    model_file = MODEL_FILES_DIR / f"{model_id}.json"
    model_file.write_text(json.dumps(model, indent=4), encoding="utf-8")


def process():
    start = time.time()

    restore_cache()

    models = get_current_models()
    images = get_images(models)
    save_cached_image_metadata(images)

    def apply(item: tuple[ModelId, Model]):
        model_id, model = item
        process_model(model_id, model, images)

    with ThreadPool(16) as pool:
        pool.map(apply, models.items())

    duration = time.time() - start
    print(f"Finished thumbnails in {duration:.2f} seconds")

    update_cache()


process()
