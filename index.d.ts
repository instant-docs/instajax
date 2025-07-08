type Config = {
    errorHTML?: string;
    initialPathName?: string;
}

export default function (config: Config): void;
export function morphDOM(htmlString: string): void;
export function configure(config: Config): void;
