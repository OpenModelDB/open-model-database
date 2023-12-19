import sys
import json
import importlib
import os


def is_installed(package: str) -> bool:
    return importlib.util.find_spec(package) is not None


def return_success(data: object):
    print("SUCCESS: " + json.dumps(data))
    sys.exit(0)


def return_error(message: str):
    print("ERROR: " + json.dumps({"message": message}))
    sys.exit(0)


def print_metadata(file: str):
    import spandrel

    try:
        loader = spandrel.ModelLoader()
        model = loader.load_from_file(file)

        return_success(
            {
                "architecture": model.architecture,
                "tags": model.tags,
                "scale": model.scale,
                "inputChannels": model.input_channels,
                "outputChannels": model.output_channels,
            }
        )
    except spandrel.UnsupportedModelError:
        return_error("Unsupported model architecture")


if __name__ == "__main__":
    if not is_installed("spandrel"):
        if is_installed("torch"):
            print("Installing spandrel...")
            current_python = sys.executable
            os.system(current_python + " -m pip install spandrel")
        else:
            return_error("PyTorch is not installed. Install PyTorch on your system's Python installation to automatically detect model metadata.")

    print_metadata(sys.argv[1])
