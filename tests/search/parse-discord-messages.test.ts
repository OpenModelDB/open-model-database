import { parseDiscordMessage } from '../../src/lib/parse-discord-message';
import { fileApi } from '../../src/lib/server/file-data';

const messages = String.raw`
**Name**: 4x_ditn_w16_pretrain
**License**: [CC0](https://creativecommons.org/share-your-work/public-domain/cc0/)
**Download (3.5mb)**: [GDrive](https://drive.google.com/drive/folders/1Fzmuw2xCChAYgX7WznaPcTFpsYdbXBWG?usp=sharing)
**Model Architecture**: DITN with Flash Attention
**Scale**: 4
**Iterations**: 215k
**Dataset**: nomos_uni
**Pretrained**: scratch
**Purpose**: Pretrain to quick start new models.
**Description**:

Meant to quick start new DITN models trained on \`neosr\`. Trained only on downscale degradation (bicubic, bilinear, nearest, lanczos and mitchell).
Note: [Flash Attention](https://github.com/muslll/neosr/blob/master/neosr/archs/ditn_arch.py#L108) breaks inference compatibility with official code.



<@&560103931204861954> <@&577839492199874570>
Name: 4xNomos8kHAT-L_bokeh_jpg
[Download](https://drive.google.com/file/d/1VSxJ6rMoaah7hyIqzJsdMLxHIgW5jYNm/view?usp=sharing)
License: CC BY 4.0
Network: HAT
Scale: 4
Purpose: 4x photo upscaler (handles bokeh effect and jpg compression)
Iterations: 145000
epoch: 66
batch_size: 4
HR_size: 128
Dataset: nomos8k
Number of train images: 8492
OTF Training: No
Pretrained_Model_G: HAT-L_SRx4_ImageNet-pretrain

Description:
4x photo upscaler, made to specifically handle bokeh effect and jpg compression. Basically a HAT-L variant of the already released 4xNomosUniDAT_bokeh_jpg model, but specifically trained for photos on the nomos8k dataset (and hopefully without the smoothing effect).

The three strengths of this model (design purpose):
Specifically for photos / photography
Handles bokeh effect
Handles jpg compression

This model will not attempt to:
Denoise
Deblur

[Example image](https://slow.pics/c/12rO9MPT) - 4xNomosUniDAT_bokeh_jpg vs 4xNomos8kHAT-L_bokeh_jpg - have a look at the back of the car, for example the WESTFALIA section



<@&560103931204861954> <@&577839492199874570>
Name: 4xNomos8kHAT-L_otf
[Download](https://drive.google.com/file/d/1_7cmypb7d-GGgGwmWmPg8ugJjOozXrFU/view?usp=drive_link)
License: CC BY 4.0
Network: HAT
Scale: 4
Purpose: 4x photo upscaler
Iterations: 220000
epoch: 19
batch_size: 4
HR_size: 128
Dataset: nomos8k
Number of train images: 8492
OTF Training: Yes
Training time: 60 hours on a remote P100
Pretrained_Model_G: HAT-L_SRx4_ImageNet-pretrain

Description:
4x photo upscaler trained with otf



<@&560103931204861954> <@&577839492199874570>
**Name:** 1x_Dehalo_v1_Compact
**License:** WTFPL
**Link:** https://mega.nz/file/lBFnHI7K#OGDMb8foOEDsNhXYoIuQIg5N6-2F9-gS9FA0G6lKcc8
**Model Architecture:** Real-ESRGAN Compact
**Scale:** 1
**Purpose:** For removing halos in anime.
**Pretrained_Model_G:** 1x_Compact_Pretrain.pth

**Description:** This is a 1x model for removing halos in animation. I was training this a while back and considered it a failed project, but I recently found it useful on a few things I was working on, so I decided to release it. I don't remember any details regarding how it was trained.
https://imgsli.com/MjE3Nzc4



**Name**: 4x_span_pretrain
**License**: CC0
**Download (7.1MB)**: [GDrive](https://drive.google.com/drive/folders/17Wyr7yCQhh9GdZcv1KT2oEXuMaV-bGjg?usp=drive_link)
**Model Architecture**: SPAN
**Scale**: 4
**Iterations**: 430k
**Dataset**: nomos_uni
**Pretrained**: official pixel loss only pretrained
**Purpose**: Pretrain to quick start new models.
**Description**:

Please load it using \`strict_load_g: false\`. Model trained only on downscale degradation (bicubic, bilinear, nearest, lanczos and mitchell). Can be used to start new SPAN models.



Name: 2x_span_anime_pretrain
License: CC0
Link: <https://mega.nz/file/HMZ0jLyL#oRUi6pn53THVgHrqwf1YNYlhaBCEcm9r7EUho9kCOLc>
Model Architecture: SPAN
Scale: 2
Iterations: 67k
Dataset: HFA2k_LUDVAE modified
Pretrained: trained on basic degradations
Purpose: Pretrain to quick start new models
Description:

This is just a very basic 2x model to start your anime models with on SPAN, nothing special. I tried to keep it as basic as possible



<@&560103931204861954> <@&577839492199874570>
**Name:** 4x-ClearRealityV1 Soft + Normal
**License:** CC BY-NC-SA 4.0
**Link:** <https://mega.nz/folder/Xc4wnC7T#yUS5-9-AbRxLhpdPW_8f2w>
**Model Architecture:** SPAN
**Scale:** 4
**Purpose:** Realistic images of humans, foliage, trees, buildings, etc.

**Iterations:** 300k (over multiple models)
**batch_size:** 12-20
**HR_size:** 128-256
**Epoch:** 40?
**Dataset:** My own UltraSharpV2 dataset, my 8k dataset (v2), Nomos8k, and FaceUp
**Dataset_size:** 19k tiles
**OTF Training** No (made with datasetDestroyer)
**Pretrained_Model_G:** Official pretrain

**Description:** Nice to release a model again! This one is intended for realistic imagery, and works especially well on faces, hair, and nature shots. It should only be used on somewhat clear shots, without a lot of grain. I trained this model on SPAN, which as of the time of release, you'll need chaiNNer-nightly for. I aimed for a softer, more natural look for this model with as few artifacts as possible.

In addition to the Normal model, I've included a "soft" model. The Soft model is... softer. Basically it was an earlier version of the model with a more limited dataset. It produces more natural output on games or rendered content, but suffers a bit more with realistic stuff.

Note: In shots with DOF (depth of field) or bokeh, unfortunately there will be artifacts.

**Compatibility:** You'll have to use the [latest chaiNNer-nightly](<https://github.com/chaiNNer-org/chaiNNer-nightly/releases/tag/2023-12-12>) to use this model

<https://imgsli.com/MjI1Nzc5>



**Name:** 1x-BroadcastToStudio_SPAN
**License:** CC BY-NC-SA 4.0
**Link:** <https://mega.nz/folder/3JIHUbpT#bSsO0RK9MOzjA8dEbl1kbw>
**Model Architecture:** SPAN
**Scale:** 1
**Iterations:** 66k
**Dataset:** SaurusX's BroadcastToStudio dataset
**Pretrained:** 1x_span_anime_pretrain
**Purpose:** Restoring classic cartoons
**Description:**

This is SaurusX's original description:
Improvement of low-quality cartoons from broadcast sources. Will greatly increase the visual quality of bad broadcast tape sources of '80s and '90s cartoons (e.g. Garfield and Friends, Heathcliff, DuckTales, etc). Directly addresses chroma blur, dot crawl, and rainbowing. You're highly advised to take care of haloing beforehand in your favorite video editor as the model will not fix it and may make existing halos more noticeable.

-------

Sadly this model has some intense artifacts. Thankfully the SPAN re-train reduced these a bit, but they're still problematic. This was just a quick test of SPAN's capabilities. This was trained only to ~66k iterations, compared to the 480k of the original.



Name: 2xEvangelion_dat2
License: CC BY 4.0
[Google Drive](https://drive.google.com/drive/folders/1SzyvuIUVHDjNMtapvtDdE3RkDGJsrHd3?usp=drive_link)
Release Date: 12.02.2024 (dd/mm/yy)
Author: Philip Hofmann
Network: SRVGGNetCompact
Scale: 2
Purpose: 2x upscaler for evangelion episodes
Iterations: 196'000
epoch: 47
batch_size: 4
HR_size: 128
Dataset: "Upscale Archive Evangelion DVD's" by pwnsweet
Number of train images: 3174
OTF Training: No
Pretrained_Model_G: DAT_2_x2

Description:
For the evangelion upscale project still, this time a dat2 model. A 2x upscaler for evangelion episodes on the evangelion dataset provided by pwnsweet, which called for model trainers to train models on it.

[Slowpoke Pics 4 Examples](https://slow.pics/s/IfJyBnIM)
`;

describe('parse discord messages', () => {
    const messageList = messages.split(/\n{4,}/).map((message, i) => {
        const name = /^\*{0,2}Name\*{0,2}:\*{0,2}\s*(.+)/m.exec(message)?.[1] ?? `message ${i}`;
        return { message, name };
    });

    const models = fileApi.models.getAll();
    const archs = fileApi.architectures.getAll();

    for (const { message, name } of messageList) {
        test(name, async () => {
            expect(parseDiscordMessage(message, await models, await archs)).toMatchSnapshot();
        });
    }
});
