import { tokenize } from '../../src/lib/search/token';

describe('tokenize', () => {
    const queries = [
        '',
        'foo',
        'fooBar',
        'FOO_BAR',
        'Foo Bar',
        'FooBar',
        '1x-AnimeUndeint-Compact',
        '1x-BleedOut-Compact',
        '1x-BroadcastToStudioLite',
        '1x-HurrDeblur-SuperUltraCompact',
        '1x-SpongeBC1-Lite',
        '2x-ATLA-KORRA',
        '2x-Bubble-AnimeScale-SwinIR-Small-v1',
        '2x-Byousoku-5-Centimeter',
        '2x-GT-evA',
        '2x-Loyaldk-LitePonyV2-0',
        '2x-SHARP-ANIME-V2',
        '2x-sudo-RealESRGAN-Dropout',
        '4x-BooruGan-650k',
        '2x-Waifaux-NL3-SuperLite',
        '1x-BaldrickVHSFixV0-2',
        '1x-BCGone-DetailedV2-40-60',
        '1x-BSChroma',
        '1x-GainRESV3-Natural',
        '1x-MangaJPEGLQ',
        '1x-ITF-SkinDiffDDS-v1',
        '1x-DEDXT',
    ];

    for (const query of queries) {
        test(query, () => {
            expect(tokenize(query)).toMatchSnapshot();
        });
    }
});
