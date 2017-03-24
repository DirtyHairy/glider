interface ImageLayer {
    getImageHeight(): number;
    getImageWidth(): number;
    isReady(): boolean;
    ready(): Promise<any>;
}

export default ImageLayer;
