interface Animation {

    progress(timestamp: number): void;

    finished(): boolean;

}

export default Animation;
