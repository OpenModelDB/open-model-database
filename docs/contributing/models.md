# Models

## What is a model on OpenModelDB?

> _This section assumes that you know what AI models are. If not, see the [FAQ](../faq.md)._

On OpenModelDB, a model represent a single checkpoint + optional conversions of it (e.g. NCNN conversions, FP16 variants, or ONNX op-set variants). Each model has its own model page on the website, where its information, download links, and example images are displayed.

A model **does not include** architecture/scale/size/iteration variants. E.g. a 2x and a 4x model trained from the same dataset are still 2 different models. Same for Compact, UltraCompact, SuperUltraCompact, etc. variants. They are all different models.

## Adding models online

> _This section assumes that you already have a GitHub account and that you are logged in._

*Work in progress*

We will add a bot in the future that will allow you to add models by commenting on an issue. This means that you won't have to check out the project locally and can just do it all online. Progress on this is [tracked here](https://github.com/OpenModelDB/open-model-database/issues/255).

## Adding models

> _This section assumes that you have [checked out the project locally](index.md#checking-out-the-project-locally) and know [how to make a pull request](index.md#how-to-make-a-pull-request)._

Start the [local dev server](index.md#local-dev-server) and open any page. There should be an "Add model" button in the header list. If not, make sure that edit mode is on. Click the "Add model" button and a new page will open.

Fill in the requested information:

-   If a pretrained model was used to train the model, select it from the dropdown. The page will use the pretrained model to fill in some information automatically. Otherwise, leave it as "None".
-   Now, we need to choose an ID for the model. This ID will be used in the URL of the model page and for the model's file name (only relevant for self-hosted models). It must be unique and can only contain letters, numbers, and hyphens. It is recommended to use the name of the model as the ID.
    -   The ID should not contain the model's scale. The scale will automatically be added to the ID when the model is added to the database.
    -   The ID should not contain any information that can be found on the model's page (e.g. number of training iterations, number of parameters, etc.). \
        The only exception to this is when this information is necessary to distinguish between two models with the same name. E.g. some models have multiple variants with different training iterations.
    -   The ID is **not** the model's name. You can enter the model's name later.
-   Enter the model's scale. This is only necessary when no pretrained model is selected.

Once that is all filled in, click the "Add model" button. After a few seconds, the page of the newly added model will open. You can now edit the model's information.

Just like any other model page, everything is editable. You don't have to fill in everything, but there are a few things that are required:

-   The model's name.
-   The author(s). (You might have to add the author to the user database first.)
-   The release date. Just leave it as today's date if you are releasing the model by adding it to the database.
-   The description. Describe what the model is intended to do. The description uses [Markdown](https://www.markdownguide.org/basic-syntax/).
-   The model's license. If the model is yours, consider using a permissive license.
-   Tags. These are used to categorize the model.
-   The model architecture.
-   The color mode.

### Adding resources

After you filled in this information and maybe more, it's time to add the model's files. Since a single model might consist of multiple files, we don't call them files, but "resources". A resource represents a single model.

Click the "Add resource" button and fill in the requested information:

-   The URL of the model's file. This can be a URL to a file on GitHub or some file hoster. Prefer using trusted file hosters like GitHub, Google Drive, Dropbox, Mega, etc. over random file hosters.
-   The file size, checksum (SHA256), and platform. If you have the model file on your computer, you can use the "Get info from file..." button to fill in this information automatically. Just select the file and the information will be filled in.

Click "Save" and the resource will be added.

Note that a single resource can have multiple URLs. This is useful when the model is hosted on multiple platforms and for mirrors.

### Adding images

To give people an idea of what the model can do, it's a good idea to add example images.

Click the `+` button below the empty image view to add either an image pair for a comparison or a single image. You can add as many images as you want. Images can also be given caption.

Note: We do not host images. Using services like [imgsli](https://imgsli.com/) to host image comparisons.

Since we need image URLs, and not just links to the pages of third-party image hosting services, the URL fields will try to automatically extract the image URL from the link. E.g. when you enter an imgsli link into the LR field, the LR and SR fields will automatically be filled in with the URLs of the images. We support multiple popular image hosters for this, so just paste URLs and it should work.
