from __future__ import annotations
from dataclasses import dataclass
import math
from pathlib import Path
from typing import Any, Literal, NewType, TypedDict, Union
import json
import importlib.util
from hashlib import sha256
import sys
import os


# install dependencies
def is_installed(*packages: str) -> bool:
    return all(importlib.util.find_spec(package) is not None for package in packages)


if not is_installed("typing_extensions", "cv2", "numpy", "requests"):
    pip_command = "pip install typing_extensions cv2 numpy requests"
    print(pip_command)
    os.system(sys.executable + " -m " + pip_command)

from typing_extensions import NotRequired  # noqa: E402
import cv2  # noqa: E402
import numpy as np  # noqa: E402
import requests  # noqa: E402

# config
MODEL_FILES_DIR = Path("data/models/")
IMAGE_DOWNLOAD_DIR = Path(".thumb-cache/images/")
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
    thumbnail: NotRequired[Image]


class PairedImage(TypedDict):
    type: Literal["paired"]
    LR: str
    SR: str


class StandaloneImage(TypedDict):
    type: Literal["standalone"]
    url: str


Image = Union[PairedImage, StandaloneImage]


def download_file(url: str, file: Path) -> None:
    """Download from url and save to file"""

    print(f"Downloading {url}")
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


class CachedImageMetadata(TypedDict):
    width: int
    height: int


def get_cached_image_metadata() -> dict[str, CachedImageMetadata]:
    try:
        if IMAGE_METADATA_JSON.exists():
            return json.loads(IMAGE_METADATA_JSON.read_text(encoding="utf-8"))

        return download_json("https://openmodeldb.info/thumbs/_image-metadata.json")
    except:  # noqa: E722
        return {}


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
    THUMBNAIL_DIR.mkdir(parents=True, exist_ok=True)
    file = THUMBNAIL_DIR / thumbnail_name

    if file.exists():
        # file exists locally
        return True

    try:
        # file exists on server
        download_file(f"https://openmodeldb.info/thumbs/{thumbnail_name}", file)
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


def encode_image(img: np.ndarray, name: str):
    params = []

    if name.endswith(".png"):
        params = [
            cv2.IMWRITE_PNG_COMPRESSION,
            9,
        ]

    if name.endswith(".jpg"):
        params = [
            cv2.IMWRITE_JPEG_QUALITY,
            90,
            cv2.IMWRITE_JPEG_PROGRESSIVE,
            1,
            cv2.IMWRITE_JPEG_OPTIMIZE,
            1,
        ]
    return cv2.imencode(name, img, params)[1].tobytes()


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
    THUMBNAIL_DIR.mkdir(parents=True, exist_ok=True)
    file = THUMBNAIL_DIR / thumbnail_name
    file.write_bytes(data)


def save_thumbnail_crop(
    image: ImageMetadata, crop: Region, ext: Literal[".jpg", ".png"]
) -> str:
    thumbnail_name = sha256_str(f"crop:{crop}:{image.url}")[:24] + ext

    if reuse_thumbnail(thumbnail_name):
        return thumbnail_name

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
    return thumbnail_name


def save_thumbnail_resize(
    image: ImageMetadata, crop_size: tuple[int, int], resize_size: tuple[int, int]
) -> str:
    thumbnail_name = (
        sha256_str(f"resize:{crop_size}:{resize_size}:{image.url}")[:24] + ".jpg"
    )

    if reuse_thumbnail(thumbnail_name):
        return thumbnail_name

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
    return thumbnail_name


def save_thumbnail_lr(image: ImageMetadata, scale: int) -> str:
    crop = get_lr_crop(image.size, scale)
    ext = ".jpg" if scale == 1 else ".png"
    return save_thumbnail_crop(image, crop, ext)


def save_thumbnail_sr(image: ImageMetadata, scale: int) -> str:
    crop = get_lr_crop((image.width // scale, image.height // scale), scale).scale(
        scale
    )
    return save_thumbnail_crop(image, crop, ".jpg")


def save_thumbnail_standalone(image: ImageMetadata) -> str:
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


def process_model(model_id: ModelId, model: Model, images: dict[str, ImageMetadata]):
    if len(model["images"]) == 0:
        return

    image = model["images"][0]
    if image["type"] == "paired":
        lr_url = image["LR"]
        sr_url = image["SR"]
        if lr_url in images and sr_url in images:
            lr, sr = images[lr_url], images[sr_url]
            # LR-SR pairs sometimes don't follow the scale factor, so it's better to calculate a scale for the pair instead of using the model scale.
            scale = round(sr.width / lr.width)
            if lr.size == sr.size:
                lr_url = "/thumbs/" + save_thumbnail_sr(images[lr_url], scale)
                sr_url = "/thumbs/" + save_thumbnail_sr(images[sr_url], scale)
            else:
                lr_url = "/thumbs/" + save_thumbnail_lr(images[lr_url], scale)
                sr_url = "/thumbs/" + save_thumbnail_sr(images[sr_url], scale)

        model["thumbnail"] = {"type": "paired", "LR": lr_url, "SR": sr_url}
    elif image["type"] == "standalone":
        url = image["url"]
        if url in images:
            url = "/thumbs/" + save_thumbnail_standalone(images[url])

        model["thumbnail"] = {"type": "standalone", "url": url}

    model_file = MODEL_FILES_DIR / f"{model_id}.json"
    model_file.write_text(json.dumps(model, indent=4), encoding="utf-8")
    print(f"Processed {model_id}")


def process():
    models = get_current_models()
    images = get_images(models)
    save_cached_image_metadata(images)

    for model_id, model in models.items():
        process_model(model_id, model, images)


process()
