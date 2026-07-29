import React, { createContext, useContext, useId, useMemo } from 'react';
import { Tooltip } from 'react-tooltip';
import { MarkdownContainer } from '../../elements/markdown';
import { useIsClient } from './use-is-client';
import { useIsTouch } from './use-is-touch';
import style from './use-tooltip.module.scss';

interface TooltipState {
    readonly tooltipId: string;
}

const TooltipContext = createContext<TooltipState>({ tooltipId: '' });

export function TooltipProvider({ children }: React.PropsWithChildren<unknown>) {
    const tooltipId = `tooltip-${useId()}`;

    const isClient = useIsClient();
    const isTouch = useIsTouch();

    const value = useMemo((): TooltipState => ({ tooltipId }), [tooltipId]);

    return (
        <TooltipContext.Provider value={value}>
            {children}

            {isClient && !isTouch && (
                <Tooltip
                    closeOnEsc
                    className={style.tooltip}
                    // Set on the tooltip itself rather than per-anchor, so every
                    // anchor gets the same delay and tooltips stop firing while
                    // the pointer is just crossing a row of tags.
                    delayHide={100}
                    delayShow={500}
                    id={tooltipId}
                    render={({ content }) => {
                        return (
                            <MarkdownContainer
                                className={style.markdown}
                                markdown={content || 'No description.'}
                            />
                        );
                    }}
                />
            )}
        </TooltipContext.Provider>
    );
}

export function useTooltip(): string {
    const { tooltipId } = useContext(TooltipContext);

    return tooltipId;
}
