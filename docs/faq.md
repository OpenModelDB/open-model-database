# Frequently asked questions

## What is a model?

"Model" is a generic term referring to a Machine Learning Model. On this site, it refers to the file you would download and use in a supported program (refer to the "Maintained Programs" section below for examples). Elsewhere, it can refer to the model's architecture, the weights, or all of the above.

You may have also heard models been called "checkpoints" before, as that is both a term used to describe checkpoints of a model's training process as well as the file type used by software that uses pytorch-lightning internally. Another term you may have come across is "pretrained model" which simply refers to a model that has already been trained, rather than giving you just the architecture and having you train it yourself.

On OpenModelDB, we distribute `.pth` (PyTorch), `.onnx` (ONNX), and `.bin`/`.param` (NCNN) pretrained model files.

## What is upscaling?

"Upscaling" (also known as "Super Resolution", "Upresing", "Upsampling", or "Upsizing") is the act of increasing the resolution (width & height dimensions) of an image (often referred to as "Single Image Super Resolution" or "SISR") or video ("Video Super Resolution" or "VSR").

Here, "Upscaling" typically refers to that done with Machine Learning/AI. This is often referred to as "AI Upscaling". For this form of upscaling, a Machine Learning Model is trained on image pairs (called a dataset) of a low-resolution and a high-resolution version of the same image. The model learns the most statistically likely way to upscale the image to produce results like that of the data it was trained on. Changing this dataset allows the model to learn different upscaling methods.

Most of the models on OpenModelDB have been trained with a specialized dataset to produce specific kinds of results, and therefore work best on specific kinds of content.

## How do I upscale?

There are many programs that can perform AI upscaling, though not all are able to use all the models listed on OpenModelDB. Our recommended program is chaiNNer, as it is actively maintained by the same people that brought you this website. However, there are plenty of other options.

### Maintained Programs

- chaiNNer (open-source | free)
  - [Wiki]() | [GitHub](https://github.com/chaiNNer-org/chaiNNer) | [Website](https://chainner.app/)
  - chaiNNer is a node-based image processing GUI that can also be used for image upscaling. It has the most support for models listed on OpenModelDB and can be run with PyTorch (CUDA), ONNX (CUDA), and NCNN (AMD/Intel). Being node based, it allows you to process your images with a lot more control, at the cost of being a bit more complex. Besides upscaling, chaiNNer also has a variety of other use cases and is a very versatile program.

- enhancr (open-source | paid)
  - [Wiki]() | [GitHub](https://github.com/mafiosnik777/enhancr)
  - Meant for fast video frame upscaling and interpolation, enhancr takes advantage of Nvidia's TensorRT to provide fast processing on video. It supports a variety of models, including many of the custom ESRGAN ones from OpenModelDB.

- VSGAN-TensorRT-docker (open-source | free)
  - [Wiki]() | [GitHub](https://github.com/styler00dollar/VSGAN-tensorrt-docker)
  - A more complicated but free alternative for fast video upscaling with TensorRT. Supports ann insane amount of models, but requires manual parameter selection.

- Upscayl (open-source | free)
  - [Wiki]() | [GitHub](https://github.com/upscayl/upscayl) | [Website](https://www.upscayl.org/)
  - Upscayl is an AI upscaling GUI targeted for use on Linux. Unlike other GUIs, Upscayl offers a simple "enhance button" style GUI. As far as I am aware, it only works with the models provided with it, but if you want something really easy to use, this can't be any easier.

- Topaz Gigapixel (closed-source | paid)
  - [Wiki]() | [Website](https://www.topazlabs.com/gigapixel-ai)
  - Gigapixel is a paid product from Topaz Labs. It does not support any models from OpenModelDB, however it is very well known in the AI upscaling space for their proprietary models.

- ComfyUI (open-source | free)
  - [Wiki]() | [GitHub](https://github.com/comfyanonymous/ComfyUI)
  - ComfyUI is a node-based Stable Diffusion UI, but it can also be used for upscaling. Code for upscaling was borrowed from chaiNNer, so it should support many of the models from OpenModelDB. However, since it is more focused on Stable Diffusion, it probably won't be as easy as other GUIs.

### Unmaintained Programs

- Joey's ESRGAN fork (open-source | free)
  - [Wiki]() | [GitHub](https://github.com/joeyballentine/ESRGAN/)
  - This is a fork (of a fork) of the original official ESRGAN CLI code by Xinntao. At one point, it was the best way to upscale as it was the only way to automatically run ESRGAN models of any configuration, and improving on vram-tiling and transparency splitting features from IEU. However, it is no longer actively maintained, and is only recommended if you just need to run ESRGAN models via CLI.

- CupScale (open-source | free)
  - [Wiki]() | [Original GitHub](https://github.com/n00mkrad/cupscale) | [Recommended Fork](https://github.com/DrPleaseRespect/cupscale) | [Alternative Fork](https://github.com/RaaynML/cupscale_continued)
  - CupScale is a winforms GUI that wraps Joey's ESRGAN CLI fork as well as the realsr-ncnn-vulkan binaries to give a lot of extra features but with the simplicity of a GUI. However, it is no longer actively maintained, and due to the amount of issues it has, we recommend using the more stable fork linked above which swaps out the backend for one based on chaiNNer, or the alternate one that just has some bug fixes. Plenty of people still use CupScale, and especially if using one of the forks is a perfectly viable option.

- IEU (open-source | free)
  - [Wiki]() | [GitHub](https://github.com/ptrsuder/IEU.Winforms)
  - IEU was the first GUI meant to make running ESRGAN models easier. It paved the way for a lot of features such as transparency splitting and VRAM-safe tiling. However, it is no longer actively maintained.

Know of more upscaling software? Let us know by posting an issue on our [GitHub Issue Tracker](https://github.com/OpenModelDB/open-model-database/issues)
