/**
 * 楊梅高中 - 梅花飄落 Canvas 動態粒子引擎
 * 象徵「德厚流廣，灼爚梅岡」的梅花意象
 */

class BlossomEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.petals = [];
        this.maxPetals = 28;
        this.animId = null;
        this.running = false;
        this.mouseX = 0;
        this.mouseY = 0;
    }

    init() {
        if (this.canvas) return;
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'blossomCanvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '999';
        this.canvas.style.opacity = '0.85';
        document.body.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        for (let i = 0; i < this.maxPetals; i++) {
            this.petals.push(this.createPetal(true));
        }
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createPetal(initial = false) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        return {
            x: Math.random() * w,
            y: initial ? Math.random() * h : -20,
            size: Math.random() * 8 + 8,
            speedY: Math.random() * 1.2 + 0.8,
            speedX: Math.random() * 1.5 - 0.5,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 2,
            swing: Math.random() * 2,
            swingSpeed: Math.random() * 0.02 + 0.01,
            color: Math.random() > 0.35 
                ? 'rgba(235, 77, 95, ' + (Math.random() * 0.35 + 0.45) + ')' // 梅花洋紅粉
                : 'rgba(255, 182, 193, ' + (Math.random() * 0.4 + 0.4) + ')' // 櫻粉淺粉
        };
    }

    drawPetal(p) {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);

        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        // 繪製心形五瓣梅花瓣剪影
        this.ctx.moveTo(0, 0);
        this.ctx.bezierCurveTo(p.size / 2, -p.size / 2, p.size, -p.size / 3, p.size, p.size / 2);
        this.ctx.bezierCurveTo(p.size, p.size, p.size / 2, p.size * 1.2, 0, p.size * 1.5);
        this.ctx.bezierCurveTo(-p.size / 2, p.size * 1.2, -p.size, p.size, -p.size, p.size / 2);
        this.ctx.bezierCurveTo(-p.size, -p.size / 3, -p.size / 2, -p.size / 2, 0, 0);
        this.ctx.fill();

        this.ctx.restore();
    }

    update() {
        if (!this.running) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < this.petals.length; i++) {
            const p = this.petals[i];
            p.swing += p.swingSpeed;
            p.x += p.speedX + Math.sin(p.swing) * 0.8;
            p.y += p.speedY;
            p.rotation += p.rotSpeed;

            // 邊界重置
            if (p.y > this.canvas.height + 20 || p.x < -30 || p.x > this.canvas.width + 30) {
                this.petals[i] = this.createPetal(false);
            }

            this.drawPetal(p);
        }

        this.animId = requestAnimationFrame(() => this.update());
    }

    start() {
        if (this.running) return;
        this.init();
        this.running = true;
        this.canvas.style.display = 'block';
        this.update();
    }

    stop() {
        this.running = false;
        if (this.animId) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }
        if (this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.canvas.style.display = 'none';
        }
    }

    toggle() {
        if (this.running) {
            this.stop();
            return false;
        } else {
            this.start();
            return true;
        }
    }
}

window.blossomEngine = new BlossomEngine();
