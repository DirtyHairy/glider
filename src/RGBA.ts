class RGBA {
    constructor (public readonly r: number, public readonly g: number, public readonly b: number,
                 public readonly alpha: number) {
        this.colorString = `rgba(${r},${g},${b},${alpha})`;
    }

    public hasAlpha(): boolean {
        return true;
    };

    public toString(): string {
        return this.colorString;
    };

    public readonly colorString: string;
}

export default RGBA;
