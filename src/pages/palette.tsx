import chroma from 'chroma-js';
import { GetStaticProps } from 'next';
import { useState } from 'react';
import { HeadCommon } from '../elements/head-common';
import { PageContainer } from '../elements/page';

const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
type ArrayItem<T> = T extends readonly (infer U)[] ? U : never;
type Step = ArrayItem<typeof steps>;
function getNearestStep(x: number): Step {
    return steps.map((s) => [s, Math.abs(s - x)] as const).sort((a, b) => a[1] - b[1])[0][0];
}

// reference L values derived from tailwind's neutral color palette
const referenceL: Readonly<Record<Step, number>> = {
    50: 98,
    100: 96,
    200: 91,
    300: 85,
    400: 66.66,
    500: 48,
    600: 36,
    700: 27,
    800: 16,
    900: 8,
} as const;
const stepToL = (step: Step): number => {
    return referenceL[step];
};

class LCH {
    constructor(public l: number, public c: number, public h: number) {}

    get color() {
        return chroma.lch(this.l, this.c, this.h);
    }

    with(key: 'l' | 'c' | 'h', value: number) {
        const copy = new LCH(this.l, this.c, this.h);
        copy[key] = value;
        return copy;
    }
}

interface StepColor {
    step: Step;
    color: chroma.Color;
    isCurrent?: boolean;
}

const methods = ['Reference L', 'Tint & Shade'] as const;
type Method = ArrayItem<typeof methods>;

export default function Page() {
    const [lch, setLch] = useState<LCH>(new LCH(50, 0, 0));
    const [method, setMethod] = useState<Method>('Reference L');

    const methodFn: Record<Method, (step: Step) => StepColor> = {
        'Reference L': (step) => {
            return {
                step,
                color: lch.with('l', stepToL(step)).color,
                isCurrent: stepToL(step) === lch.l,
            };
        },
        'Tint & Shade': (step) => {
            const p = 1 - step / 1000;
            const center = 1 - getNearestStep((lch.l / 100) * 1000) / 1000;
            return {
                step,
                color:
                    p <= center
                        ? chroma.scale(['black', lch.color]).mode('lab')(p / center)
                        : chroma.scale([lch.color, 'white']).mode('lab')((p - center) / (1 - center)),
                isCurrent: p === center,
            };
        },
    };
    const colors = steps.map(methodFn[method]);

    return (
        <>
            <HeadCommon
                noIndex
                title="Palette Generator"
            />
            <PageContainer>
                <div>
                    <p>
                        <input
                            type="text"
                            value={lch.color.hex()}
                            onChange={(e) => {
                                const text = e.target.value;
                                let color;
                                try {
                                    color = chroma(text);
                                } catch {
                                    try {
                                        color = chroma(`#${text}`);
                                    } catch {}
                                }
                                if (color) setLch(new LCH(...color.lch()));
                            }}
                        />
                    </p>
                    <p>
                        <span
                            style={{
                                width: '2em',
                                height: '2em',
                                display: 'inline-block',
                                background: lch.color.hex(),
                            }}
                        />
                    </p>
                    <p>
                        <span style={{ width: '3em', display: 'inline-block', textAlign: 'right' }}>
                            L {Math.round(lch.l)}
                        </span>
                        <input
                            max={100}
                            min={0}
                            type="range"
                            value={lch.l}
                            onChange={(e) => {
                                setLch(lch.with('l', Number(e.target.value)));
                            }}
                        />
                        <span style={{ width: '3em', display: 'inline-block', textAlign: 'right' }}>
                            C {Math.round(lch.c)}
                        </span>
                        <input
                            max={150}
                            min={0}
                            type="range"
                            value={lch.c}
                            onChange={(e) => {
                                setLch(lch.with('c', Number(e.target.value)));
                            }}
                        />
                        <span style={{ width: '3em', display: 'inline-block', textAlign: 'right' }}>
                            H {Math.round(lch.h)}
                        </span>
                        <input
                            max={360}
                            min={0}
                            type="range"
                            value={lch.h}
                            onChange={(e) => {
                                setLch(lch.with('h', Number(e.target.value)));
                            }}
                        />
                    </p>
                    <p>
                        <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value as Method)}
                        >
                            {methods.map((m) => (
                                <option
                                    key={m}
                                    value={m}
                                >
                                    {m}
                                </option>
                            ))}
                        </select>
                    </p>
                    <p style={{ display: 'flex' }}>
                        {colors.map(({ step, color, isCurrent }) => {
                            return (
                                <span
                                    key={step}
                                    style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}
                                >
                                    <span
                                        style={{
                                            width: '4em',
                                            height: '2em',
                                            display: 'block',
                                            background: color.hex(),
                                        }}
                                    />
                                    <span style={{ fontWeight: isCurrent ? 'bold' : 'inherit' }}>{step}</span>
                                    <span style={{ fontFamily: 'monospace' }}>{color.hex()}</span>
                                </span>
                            );
                        })}
                    </p>
                    <pre>
                        {colors.map(({ step, color }) => {
                            return <span key={step}>{`$name-${step}: ${color.hex()};\n`}</span>;
                        })}
                    </pre>
                </div>
            </PageContainer>
        </>
    );
}

export const getStaticProps: GetStaticProps = (_context) => {
    if (process.env.NODE_ENV === 'production') {
        return { notFound: true };
    }
    return { props: {} };
};
