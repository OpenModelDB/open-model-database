import React from 'react';

export function joinList(elements: JSX.Element[], conjunction: 'and' | 'or' = 'and'): JSX.Element {
    if (elements.length === 0) {
        return <>[none]</>;
    } else if (elements.length === 1) {
        return elements[0];
    } else if (elements.length === 2) {
        const [a, b] = elements;
        return (
            <>
                {a} {conjunction} {b}
            </>
        );
    } else {
        return (
            <>
                {elements.map((e, i) => {
                    let prefix;
                    if (i === 0) {
                        prefix = '';
                    } else if (i === elements.length - 1) {
                        prefix = `, ${conjunction}`;
                    } else {
                        prefix = ', ';
                    }

                    return (
                        <React.Fragment key={e.key ?? i}>
                            {prefix}
                            {e}
                        </React.Fragment>
                    );
                })}
            </>
        );
    }
}
