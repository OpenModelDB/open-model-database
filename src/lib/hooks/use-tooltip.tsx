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
