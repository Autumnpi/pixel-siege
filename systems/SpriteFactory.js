const SpriteFactory = {
    generateAll(scene) {
        for (const [key, def] of Object.entries(SPRITE_DEFS)) {
            if (def.frames.length > 1) {
                this._generateSpritesheet(scene, key, def);
            } else {
                this._generateSingle(scene, key, def.frames[0], def.scale);
            }
        }
    },

    _generateSingle(scene, key, pixels, scale) {
        const rows = pixels.length;
        const cols = pixels[0].length;
        const canvas = document.createElement('canvas');
        canvas.width  = cols * scale;
        canvas.height = rows * scale;
        const ctx = canvas.getContext('2d');
        this._drawPixels(ctx, pixels, scale, 0);
        scene.textures.addCanvas(key, canvas);
    },

    _generateSpritesheet(scene, key, def) {
        const { scale, frames, frameRate, loop } = def;
        const rows = frames[0].length;
        const cols = frames[0][0].length;
        const fw = cols * scale;
        const fh = rows * scale;
        const canvas = document.createElement('canvas');
        canvas.width  = fw * frames.length;
        canvas.height = fh;
        const ctx = canvas.getContext('2d');

        frames.forEach((frame, fi) => {
            this._drawPixels(ctx, frame, scale, fi * fw);
        });

        scene.textures.addCanvas(key, canvas);

        // Register frame data so Phaser can slice the spritesheet
        const texture = scene.textures.get(key);
        for (let i = 0; i < frames.length; i++) {
            texture.add(i, 0, i * fw, 0, fw, fh);
        }

        // Register animation
        scene.anims.create({
            key: key,
            frames: Array.from({ length: frames.length }, (_, i) => ({ key, frame: i })),
            frameRate: frameRate || 8,
            repeat: (loop === false) ? 0 : -1,
        });
    },

    _drawPixels(ctx, pixels, scale, offsetX) {
        for (let r = 0; r < pixels.length; r++) {
            for (let c = 0; c < pixels[r].length; c++) {
                const color = pixels[r][c];
                if (color === 0) continue;
                ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
                ctx.fillRect(offsetX + c * scale, r * scale, scale, scale);
            }
        }
    },
};
