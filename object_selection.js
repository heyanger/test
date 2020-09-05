import * as THREE from './three.module.js';

var camera, scene, renderer, raycaster, mesh, raycastObjectGroup, labelSprite;
var popupWindow;
var mouse = new THREE.Vector2();
var isUserInteracting = false,
    isMoving = false,
    onMouseDownMouseX = 0, onMouseDownMouseY = 0,
    lon = 0, onMouseDownLon = 0,
    lat = 0, onMouseDownLat = 0,
    phi = 0, theta = 0;

init();
animate();

var projector, vector3, intersections;

function init() {

    var container;

    container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1100);
    camera.position.set(0, 0, 0)
    camera.target = new THREE.Vector3(0, 0, 0);

    scene = new THREE.Scene();

    // projector = new THREE.Projector();


    var geometry = new THREE.SphereBufferGeometry(500, 60, 40);
    // invert the geometry on the x-axis so that all of the faces point inward
    geometry.scale(- 1, 1, 1);

    var texture = new THREE.TextureLoader().load('supermarket.jpg');
    var material = new THREE.MeshBasicMaterial({ map: texture });

    mesh = new THREE.Mesh(geometry, material);

    scene.add(mesh);

    labelSprite = createSprite();
    console.log('sprite', labelSprite)
    scene.add(labelSprite);

    raycastObjectGroup = new THREE.Group();
    // raycastObjectGroup.add(sprite);
    // scene.add(raycastObjectGroup);

    raycaster = new THREE.Raycaster();

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    container.addEventListener('mousedown', onPointerStart, false);
    container.addEventListener('mousemove', onPointerMove, false);
    container.addEventListener('mouseup', onPointerUp, false);

    container.addEventListener('wheel', onDocumentMouseWheel, false);

    container.addEventListener('touchstart', onPointerStart, false);
    container.addEventListener('touchmove', onPointerMove, false);
    container.addEventListener('touchend', onPointerUp, false);

    //

    container.addEventListener('dragover', function (event) {

        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';

    }, false);

    document.addEventListener('dragenter', function () {

        document.body.style.opacity = 0.5;

    }, false);

    document.addEventListener('dragleave', function () {

        document.body.style.opacity = 1;

    }, false);

    document.addEventListener('drop', function (event) {

        event.preventDefault();

        var reader = new FileReader();
        reader.addEventListener('load', function (event) {

            material.map.image.src = event.target.result;
            material.map.needsUpdate = true;

        }, false);
        reader.readAsDataURL(event.dataTransfer.files[0]);

        document.body.style.opacity = 1;

    }, false);

    //

    window.addEventListener('resize', onWindowResize, false);

}

function createSprite() {
    console.log(createSprite)
    var textureLoader = new THREE.TextureLoader();
    var map = textureLoader.load("target_arrow.webp");
    var material = new THREE.SpriteMaterial({ map: map, color: 0xffffff, fog: true });

    var sprite = new THREE.Sprite(material);
    /* 463.06191297834766
    ​​​
    y: -184.44470208850993
    ​​​
    z: 27.13900248713759 */
    sprite.position.set(463.06191297834766, -184.44470208850993, 27.13900248713759);
    sprite.position.normalize();
    sprite.position.multiplyScalar(10);
    return sprite;

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function onPointerStart(event) {

    isUserInteracting = true;

    var clientX = event.clientX || event.touches[0].clientX;
    var clientY = event.clientY || event.touches[0].clientY;

    onMouseDownMouseX = clientX;
    onMouseDownMouseY = clientY;

    onMouseDownLon = lon;
    onMouseDownLat = lat;

    if (popupWindow) {
        // document.body.removeChild(popupWindow);
        // popupWindow = null;
    }

}

function onPointerMove(event) {

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    if (isUserInteracting === true) {

        var clientX = event.clientX || event.touches[0].clientX;
        var clientY = event.clientY || event.touches[0].clientY;

        lon = (onMouseDownMouseX - clientX) * 0.1 + onMouseDownLon;
        lat = (clientY - onMouseDownMouseY) * 0.1 + onMouseDownLat;

        isMoving = true;
        if (popupWindow) {
            // projector.projectVector(vector3.setFromMatrixPosition(labelSprite.matrixWorld), camera);
            vector3 = labelSprite.getWorldPosition();
            vector3.project(camera);
            const widthHalf = window.innerWidth / 2;
            const heightHalf = window.innerHeight / 2;
            vector3.x = (vector3.x * widthHalf) + widthHalf;
            vector3.y = -(vector3.y * heightHalf) + heightHalf;
            popupWindow.setAttribute('style', `top: ${vector3.y}px; left: ${vector3.x}px;`)
        }
    } else {


        raycaster.setFromCamera(new THREE.Vector3(mouse.x, mouse.y, 0.5), camera)
        intersections = raycaster.intersectObjects([labelSprite]);
        // console.log(intersections);
        if (intersections.length > 0) {
            labelSprite.material.color.set('#ff0000')
            document.body.style.cursor = 'pointer';
        } else {
            labelSprite.material.color.set('#fff')
            document.body.style.cursor = 'auto';
        }


    }

}

function onPointerUp(event) {
    console.log('isMoving', isMoving, event.clientX, event.clientY)
    if (!isMoving) {
        if (popupWindow) {
            document.body.removeChild(popupWindow);
            popupWindow = null
        }
        if (intersections.length > 0) {
            popupWindow = createPopup('Product Name',
                `Lorem ipsum dolor sit amet, 
                    consectetur adipiscing elit, 
                    sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
                '99.99',
                { x: event.clientX, y: event.clientY }
            )
            camera.lookAt(labelSprite);
        }
        /* raycaster.setFromCamera(new THREE.Vector3(mouse.x, mouse.y, 0.5), camera)
        intersections = raycaster.intersectObjects([mesh]);
        console.log(intersections); */

    }
    isMoving = false;
    isUserInteracting = false;
}

function onDocumentMouseWheel(event) {

    var fov = camera.fov + event.deltaY * 0.05;

    camera.fov = THREE.MathUtils.clamp(fov, 10, 75);

    camera.updateProjectionMatrix();

}

function animate() {

    requestAnimationFrame(animate);
    update();

}

function update() {

    /* if ( isUserInteracting === false ) {

        lon += 0.1;

    } */

    lat = Math.max(- 85, Math.min(85, lat));
    phi = THREE.MathUtils.degToRad(90 - lat);
    theta = THREE.MathUtils.degToRad(lon);

    camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
    camera.target.y = 500 * Math.cos(phi);
    camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);

    camera.lookAt(camera.target);

    /*
    // distortion
    camera.position.copy( camera.target ).negate();
    */

    renderer.render(scene, camera);

}

function createPopup(title, description, price, position) {
    const div = document.createElement('div');
    div.className = 'popup'
    // div.style.top = `${position.y}px`;
    // div.style.left = `${position.x}px`;
    console.log(position)
    div.setAttribute('style', `left: ${position.x}px; top: ${position.y}px;`)
    // div.setAttribute('style', `top: ${position.y}px`)

    const header = document.createElement('div');
    header.className = 'header'
    div.appendChild(header)

    const titleHeader = document.createElement('h1');
    titleHeader.className = 'header-title'
    titleHeader.innerHTML = title;
    header.appendChild(titleHeader);

    const close = document.createElement('button')
    close.className = 'close-button';
    close.innerHTML = 'X'
    function removePopup(e) {
        e.stopPropagation(); document.body.removeChild(div)
        close.removeEventListener('click', removePopup)
        popupWindow = null;
    }
    close.addEventListener('click', removePopup)
    header.appendChild(close)

    const image = document.createElement('img')
    image.className = 'img-preview';
    image.src = '/biscuits.jpg'
    div.appendChild(image);

    const desc = document.createElement('div');
    desc.style.lineHeight = '18px';
    desc.innerHTML = description;
    div.appendChild(desc);

    const priceTag = document.createElement('div');
    priceTag.className = 'price-tag'
    priceTag.innerHTML = `S$ ${price}`
    div.appendChild(priceTag);

    document.body.appendChild(div);

    return div;
}
