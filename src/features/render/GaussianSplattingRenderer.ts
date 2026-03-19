/**
 * 3D Gaussian Splatting Renderer
 * 基于 WebGL2 的实时神经渲染
 */

import * as THREE from 'three';

export interface GaussianSplattingOptions {
  container: HTMLElement;
  camera?: THREE.Camera;
  backgroundColor?: number;
}

export class GaussianSplattingRenderer {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private animationId: number | null = null;

  // Gaussian 数据
  private positions: Float32Array | null = null;
  private colors: Float32Array | null = null;
  private scales: Float32Array | null = null;
  private rotations: Float32Array | null = null;
  private opacities: Float32Array | null = null;

  // 渲染相关
  private _gaussianCount = 0;
  private pointCloud: THREE.Points | null = null;

  // 交互状态
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private spherical = { theta: 0, phi: Math.PI / 2, radius: 5 };
  private onResize: (() => void) | null = null;

  // 事件处理函数引用 (用于 dispose 时移除)
  private boundMouseDown: ((e: MouseEvent) => void) | null = null;
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundMouseUp: (() => void) | null = null;
  private boundMouseLeave: (() => void) | null = null;
  private boundWheel: ((e: WheelEvent) => void) | null = null;

  // 触摸事件处理函数引用
  private boundTouchStart: ((e: TouchEvent) => void) | null = null;
  private boundTouchMove: ((e: TouchEvent) => void) | null = null;
  private boundTouchEnd: (() => void) | null = null;

  // 灯光引用
  private ambientLight: THREE.AmbientLight | null = null;
  private pointLight1: THREE.PointLight | null = null;
  private pointLight2: THREE.PointLight | null = null;

  constructor(options: GaussianSplattingOptions) {
    this.container = options.container;

    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(options.backgroundColor ?? 0x0a0a0f);

    // 创建相机 - 防御除零错误
    const width = this.container.clientWidth || 1;
    const height = this.container.clientHeight || 1;
    const aspect = width / height;

    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 5);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    // 添加环境光
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    // 添加点光源
    this.pointLight1 = new THREE.PointLight(0x00ffff, 1, 100);
    this.pointLight1.position.set(5, 5, 5);
    this.scene.add(this.pointLight1);

    this.pointLight2 = new THREE.PointLight(0xff00ff, 0.8, 100);
    this.pointLight2.position.set(-5, -5, 5);
    this.scene.add(this.pointLight2);

    // 绑定事件
    this.bindEvents();

    // 开始渲染循环
    this.animate();
  }

  /**
   * 加载 Gaussian Splatting 数据 (.ply 格式)
   */
  async loadFromPLY(url: string): Promise<void> {
    let response: Response;

    try {
      // 发起网络请求
      response = await fetch(url);

      // 检查响应状态
      if (!response.ok) {
        throw new Error(`加载失败: ${response.status} ${response.statusText}`);
      }

      // 检查内容类型
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('text') && !contentType.includes('octet-stream')) {
        console.warn(`警告: 意外的内容类型 ${contentType}，将继续尝试解析`);
      }

      const text = await response.text();

      // 检查响应是否为空
      if (!text || text.trim().length === 0) {
        throw new Error('加载失败: 响应内容为空');
      }

      // 解析 PLY 格式
      const lines = text.split('\n');
      let headerEnd = 0;
      let vertexCount = 0;

      // 解析 header
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (!line) continue;

        if (line.trim() === 'end_header') {
          headerEnd = i + 1;
          break;
        }
        if (line.startsWith('element vertex')) {
          const parts = line.split(' ');

          vertexCount = parseInt(parts[2] ?? '0', 10);
        }
      }

      // 检查顶点数量是否有效
      if (vertexCount <= 0) {
        throw new Error('加载失败: 无效的顶点数量');
      }

      // 清理旧点云
      this.disposePointCloud();

      this._gaussianCount = vertexCount;
      this.positions = new Float32Array(vertexCount * 3);
      this.colors = new Float32Array(vertexCount * 3);
      this.scales = new Float32Array(vertexCount * 3);
      this.rotations = new Float32Array(vertexCount * 4);
      this.opacities = new Float32Array(vertexCount);

      // 解析顶点数据 (简化版 - 实际需要根据具体格式调整)
      for (let i = 0; i < vertexCount; i++) {
        const line = lines[headerEnd + i];

        if (!line) continue;
        const parts = line.trim().split(/\s+/);

        if (parts.length >= 6) {
          // 位置 - 添加 NaN 验证
          const x = parseFloat(parts[0] ?? '0');
          const y = parseFloat(parts[1] ?? '0');
          const z = parseFloat(parts[2] ?? '0');

          if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) continue;

          this.positions[i * 3] = x;
          this.positions[i * 3 + 1] = y;
          this.positions[i * 3 + 2] = z;

          // 颜色 (假设是 RGB)
          this.colors[i * 3] = parseFloat(parts[3] ?? '0') / 255;
          this.colors[i * 3 + 1] = parseFloat(parts[4] ?? '0') / 255;
          this.colors[i * 3 + 2] = parseFloat(parts[5] ?? '0') / 255;

          // 默认缩放和旋转
          this.scales[i * 3] = 0.01;
          this.scales[i * 3 + 1] = 0.01;
          this.scales[i * 3 + 2] = 0.01;

          this.rotations[i * 4] = 1; // w
          this.rotations[i * 4 + 1] = 0;
          this.rotations[i * 4 + 2] = 0;
          this.rotations[i * 4 + 3] = 0;

          // 默认不透明度
          this.opacities[i] = 0.5;
        }
      }

      this.createPointCloud();
    } catch (error) {
      // 提供用户友好的错误信息
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('网络错误: 无法连接到服务器，请检查网络连接');
      }
      if (error instanceof SyntaxError) {
        throw new Error('解析错误: 文件格式无效，无法解析 PLY 数据');
      }
      if (error instanceof Error) {
        throw error; // 已经格式化的错误直接抛出
      }
      throw new Error(`加载失败: ${error}`);
    }
  }

  /**
   * 清理旧点云资源
   */
  private disposePointCloud(): void {
    if (this.pointCloud) {
      const geometry = this.pointCloud.geometry;
      const material = this.pointCloud.material as THREE.ShaderMaterial;

      geometry.deleteAttribute('position');
      geometry.deleteAttribute('color');
      geometry.deleteAttribute('normal');
      geometry.deleteAttribute('uv');
      geometry.dispose();

      if (material.uniforms) {
        for (const key in material.uniforms) {
          const uniform = material.uniforms[key];
          if (uniform && typeof uniform === 'object') {
            if ('value' in uniform && uniform.value instanceof THREE.Texture) {
              uniform.value.dispose();
            }
            if ('value' in uniform && Array.isArray(uniform.value)) {
              uniform.value.forEach((item: unknown) => {
                if (item instanceof THREE.Texture) {
                  item.dispose();
                }
              });
            }
          }
        }
      }

      material.dispose();
      material.vertexShader = '';
      material.fragmentShader = '';

      this.scene.remove(this.pointCloud);
      this.pointCloud = null;
    }
  }

  /**
   * 生成演示数据 - 创建惊艳的 3D 场景
   */
  generateDemoScene(): void {
    // 清理旧点云
    this.disposePointCloud();
    const count = 50000; // 5万 个高斯点

    this._gaussianCount = count;

    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    this.scales = new Float32Array(count * 3);
    this.opacities = new Float32Array(count);

    // 创建螺旋星系形状
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 20; // 10 圈螺旋
      const radius = 0.5 + t * 3;
      const height = (Math.random() - 0.5) * 0.5;

      // 螺旋位置
      this.positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.1;
      this.positions[i * 3 + 1] = height;
      this.positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.1;

      // 颜色渐变 - 从青色到紫色到金色
      const hue = 0.5 + t * 0.3; // 色相变化
      const sat = 0.8 + Math.random() * 0.2;
      const light = 0.4 + Math.random() * 0.4;

      const color = new THREE.Color();

      color.setHSL(hue % 1, sat, light);

      this.colors[i * 3] = color.r;
      this.colors[i * 3 + 1] = color.g;
      this.colors[i * 3 + 2] = color.b;

      // 缩放 - 中心密外面疏
      const scale = 0.02 + Math.random() * 0.03;

      this.scales[i * 3] = scale;
      this.scales[i * 3 + 1] = scale;
      this.scales[i * 3 + 2] = scale;

      // 不透明度
      this.opacities[i] = 0.3 + Math.random() * 0.7;
    }

    this.createPointCloud();
  }

  /**
   * 创建点云渲染
   */
  private createPointCloud(): void {
    if (!this.positions || !this.colors) return;

    // 创建几何体
    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    // 创建着色器材质 - 实现高斯模糊效果
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uSize: { value: 80.0 },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying float vOpacity;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uSize;
        
        void main() {
          vColor = color;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // 距离衰减
          float dist = length(mvPosition.xyz);
          vOpacity = 1.0 / (1.0 + dist * 0.1);
          
          gl_PointSize = uSize * uPixelRatio * (1.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          // 高斯模糊圆形
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float alpha = exp(-dist * dist * 8.0) * vOpacity;
          
          if (alpha < 0.01) discard;
          
          // 添加发光效果
          vec3 glow = vColor * 1.5;
          gl_FragColor = vec4(glow, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.pointCloud = new THREE.Points(geometry, material);
    this.scene.add(this.pointCloud);
  }

  /**
   * 渲染循环
   */
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const time = performance.now() * 0.001;

    // 更新点云动画
    if (this.pointCloud) {
      const material = this.pointCloud.material as THREE.ShaderMaterial;

      if (material.uniforms['uTime']) {
        (material.uniforms['uTime'] as THREE.IUniform<number>).value = time;
      }

      // 缓慢旋转
      this.pointCloud.rotation.y = time * 0.1;
    }

    // 更新相机位置
    this.updateCamera();

    this.renderer.render(this.scene, this.camera);
  };

  /**
   * 更新相机位置
   */
  private updateCamera(): void {
    const { theta, phi, radius } = this.spherical;

    this.camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
    this.camera.position.y = radius * Math.cos(phi);
    this.camera.position.z = radius * Math.sin(phi) * Math.sin(theta);

    this.camera.lookAt(0, 0, 0);
  }

  /**
   * 绑定交互事件
   */
  private bindEvents(): void {
    const canvas = this.renderer.domElement;

    // 鼠标按下事件
    this.boundMouseDown = (e: MouseEvent) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };
    canvas.addEventListener('mousedown', this.boundMouseDown);

    // 鼠标移动事件
    this.boundMouseMove = (e: MouseEvent) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.spherical.theta += deltaX * 0.01;
      this.spherical.phi = Math.max(
        0.1,
        Math.min(Math.PI - 0.1, this.spherical.phi + deltaY * 0.01)
      );

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };
    canvas.addEventListener('mousemove', this.boundMouseMove);

    // 鼠标释放事件
    this.boundMouseUp = () => {
      this.isDragging = false;
    };
    canvas.addEventListener('mouseup', this.boundMouseUp);

    // 鼠标离开事件
    this.boundMouseLeave = () => {
      this.isDragging = false;
    };
    canvas.addEventListener('mouseleave', this.boundMouseLeave);

    // 滚轮缩放
    this.boundWheel = (e: WheelEvent) => {
      e.preventDefault();
      this.spherical.radius = Math.max(1, Math.min(20, this.spherical.radius + e.deltaY * 0.01));
    };
    canvas.addEventListener('wheel', this.boundWheel, { passive: false });

    // ===== 触摸事件支持 (移动端交互) =====
    // 触摸开始
    this.boundTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (e.touches.length === 1 && touch) {
        e.preventDefault();
        this.isDragging = true;
        this.previousMousePosition = {
          x: touch.clientX,
          y: touch.clientY
        };
      }
    };
    canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });

    // 触摸移动
    this.boundTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!this.isDragging || e.touches.length !== 1 || !touch) return;
      e.preventDefault();

      const deltaX = touch.clientX - this.previousMousePosition.x;
      const deltaY = touch.clientY - this.previousMousePosition.y;

      this.spherical.theta += deltaX * 0.01;
      this.spherical.phi = Math.max(
        0.1,
        Math.min(Math.PI - 0.1, this.spherical.phi + deltaY * 0.01)
      );

      this.previousMousePosition = {
        x: touch.clientX,
        y: touch.clientY
      };
    };
    canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });

    // 触摸结束
    this.boundTouchEnd = () => {
      this.isDragging = false;
    };
    canvas.addEventListener('touchend', this.boundTouchEnd);
    canvas.addEventListener('touchcancel', this.boundTouchEnd);

    // 窗口大小调整 - 防御除零错误
    this.onResize = () => {
      const width = this.container.clientWidth || 1;
      const height = this.container.clientHeight || 1;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };
    window.addEventListener('resize', this.onResize);
  }

  /**
   * 获取 Gaussian 数量
   */
  get gaussianCount(): number {
    return this._gaussianCount;
  }

  /**
   * 获取渲染器 DOM 元素
   */
  getElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  /**
   * 释放资源
   */
  dispose(): void {
    // 停止动画循环
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // 移除 window resize 监听器
    if (this.onResize) {
      window.removeEventListener('resize', this.onResize);
      this.onResize = null;
    }

    const canvas = this.renderer.domElement;

    // 移除鼠标事件监听器
    if (this.boundMouseDown) {
      canvas.removeEventListener('mousedown', this.boundMouseDown);
      this.boundMouseDown = null;
    }
    if (this.boundMouseMove) {
      canvas.removeEventListener('mousemove', this.boundMouseMove);
      this.boundMouseMove = null;
    }
    if (this.boundMouseUp) {
      canvas.removeEventListener('mouseup', this.boundMouseUp);
      this.boundMouseUp = null;
    }
    if (this.boundMouseLeave) {
      canvas.removeEventListener('mouseleave', this.boundMouseLeave);
      this.boundMouseLeave = null;
    }
    if (this.boundWheel) {
      canvas.removeEventListener('wheel', this.boundWheel);
      this.boundWheel = null;
    }

    // 移除触摸事件监听器
    if (this.boundTouchStart) {
      canvas.removeEventListener('touchstart', this.boundTouchStart);
      this.boundTouchStart = null;
    }
    if (this.boundTouchMove) {
      canvas.removeEventListener('touchmove', this.boundTouchMove);
      this.boundTouchMove = null;
    }
    if (this.boundTouchEnd) {
      canvas.removeEventListener('touchend', this.boundTouchEnd);
      canvas.removeEventListener('touchcancel', this.boundTouchEnd);
      this.boundTouchEnd = null;
    }

    // 清理点云资源
    if (this.pointCloud) {
      const geometry = this.pointCloud.geometry;
      const material = this.pointCloud.material as THREE.ShaderMaterial;

      // 清理几何体的所有属性
      geometry.deleteAttribute('position');
      geometry.deleteAttribute('color');
      geometry.deleteAttribute('normal');
      geometry.deleteAttribute('uv');
      geometry.dispose();

      // 清理 shader material 的 uniforms 和 attributes
      if (material.uniforms) {
        // 清理每个 uniform
        for (const key in material.uniforms) {
          const uniform = material.uniforms[key];
          if (uniform && typeof uniform === 'object') {
            // 处理纹理uniform
            if ('value' in uniform && uniform.value instanceof THREE.Texture) {
              uniform.value.dispose();
            }
            // 处理数组类型的uniform
            if ('value' in uniform && Array.isArray(uniform.value)) {
              uniform.value.forEach((item: unknown) => {
                if (item instanceof THREE.Texture) {
                  item.dispose();
                }
              });
            }
          }
        }
      }

      // 清理 shader 程序 (通过dispose自动清理)
      material.dispose();
      material.vertexShader = '';
      material.fragmentShader = '';

      // 从场景中移除点云
      this.scene.remove(this.pointCloud);
      this.pointCloud = null;
    }

    // 清理场景中的灯光 - 调用 dispose() 防止内存泄漏
    this.scene.children
      .filter((child) => child instanceof THREE.Light)
      .forEach((light) => {
        (light as THREE.Light).dispose();
        this.scene.remove(light);
      });

    // 清理灯光引用
    this.ambientLight = null;
    this.pointLight1 = null;
    this.pointLight2 = null;

    // 清理背景
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background = null;
    }

    // 释放 Three.js 渲染器
    this.renderer.dispose();
    this.renderer.domElement.remove();

    // 清理数据数组
    this.positions = null;
    this.colors = null;
    this.scales = null;
    this.rotations = null;
    this.opacities = null;
  }
}
