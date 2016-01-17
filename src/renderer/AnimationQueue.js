import Collection from '../utils/Collection';

export default class AnimationQueue extends Collection {
    progress(timestamp) {
        const animations = this.items();

        let len = animations.length,
            i = 0;

        while (i < len) {
            animations[i].progress(timestamp);

            if (animations[i].finished()) {
                len--;
                this.remove(animations[i]);
            } else {
                i++;
            }
        }
    }
}
