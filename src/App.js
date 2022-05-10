import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import Webcam from 'react-webcam';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import './App.scss';
import { drawMesh } from './utiilities';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import skyblueLens from './images/skyblueLens.png'
import redLens from './images/redLens.png'

const App = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasResultRef = useRef();
  const [image, setImage] = useState('');
  const [currentColor, setCurrentColor] = useState(skyblueLens);
  const [sources, setSources] = useState({})
  let leftEyePos, rightEyePos;

  const capture = useCallback(() => {
    const imgSrc = webcamRef.current.getScreenshot();
    // setImage(imgSrc);
    console.log(currentColor, 'clcolor')
    setSources({
      leftEye: currentColor,
      rightEye: currentColor,
      mainImage: imgSrc
    })
  }, [webcamRef.current, currentColor]);

  useEffect(() => {
    setSources(sc => ({...sc, leftEye: currentColor, rightEye: currentColor}))
    return () => {
      
    }
  }, [currentColor])
  

  async function predictions(image){
    await tf.setBackend('cpu');
    let model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
        {maxFaces: 1});
    const faces = await model.estimateFaces({ input: image });
    return faces
  }

  // load facemesh
  const runFaceMesh = async (model, image_buffer) => {
    // await tf.setBackend('cpu');
    // const model = await faceLandmarksDetection.load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {maxFaces: 1});
    console.log('runFaceMesh')
    async function loadImages(sources, callback) {
      var images = {};
      var loadedImages = 0;
      var numImages = 0;
      // get num of sources
      for(var src in sources) {
        numImages++;
      }
      console.log(numImages, sources, 'scs')
      for(var src in sources) {
        images[src] = new Image();
        console.log(images, loadedImages, numImages, 'images');
        images[src].onload = await function() {
          if(++loadedImages >= numImages) {
            callback(images)
          }
        };
        images[src].src = sources[src];
      }
    }

    // var sources = {
    //   leftEye: skyblueLens,
    //   rightEye: skyblueLens,
    //   mainImage: image_buffer
    // };

    loadImages(sources, editImage);
    // let timer;
    function editImage(images) {
    //   timer = setInterval(() => {
      console.log('editImage', model)
        detect(model, images);
    //   }, 10);
    }
    // return timer;
  };

  // detect function
  const detect = async (net, images) => {
    if (
      typeof webcamRef.current !== 'undefined' &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      console.log('detect')
      // get video properties
      // const image = webcamRef.current.getScreenshot();
      // const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // set video width
      // webcamRef.current.video.width = videoWidth;
      // webcamRef.current.video.height = videoHeight;

      // set canvase width
      canvasResultRef.current.width = videoWidth;
      canvasResultRef.current.height = videoHeight;

      // const img = new Image();
      // img.src=image;

      // make detections
      // get canvas context for drawing
      const canvas = canvasResultRef.current;
      const ctx = canvas.getContext('2d');
      // let imageData = ctx.getImageData(0,0,480,640);
      // ctx.putImageData(contrastImage(imageData, .98), 0, 0);
      // let prediction = await predictions(img);
      const face0 = await net.estimateFaces({input: images.mainImage});
      // const face = await predictions(video);
      // console.log(face0, face, prediction, 'faceh')
      drawMesh(face0, ctx, images, canvas);
      // console.log(ctx);
    }
  };

  const model = useMemo(async() => {
    await tf.setBackend('cpu');
    const model = await faceLandmarksDetection.load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {maxFaces: 1});
    return model
  }, []);
  
  useEffect(() => {
    model.then((mdl) => {
      console.log(mdl, 'mdl')
      if(sources.mainImage) {
        runFaceMesh(mdl, sources.mainImage);
      }
    }).catch(err => console.log(err))
    return () => {
    }
  }, [sources.mainImage]);
  return (
    <div className='container'>
      <select value={currentColor} onChange={(e) => setCurrentColor(e.target.value)}>
        <option value={skyblueLens}>Blue</option>
        <option value={redLens}>Red</option>
      </select>
      <div className='webcam-img'>
        {/* {image === '' ? ( */}
          <Webcam
            ref={webcamRef}
            className='canvasContainer'
            screenshotFormat='image/jpeg'
            style={{
              // position: 'absolute',
              marginLeft: 'auto',
              marginRight: 'auto',
              // left: 0,
              right: '100%',
              textAlign: 'center',
              zindex: 9,
              width: 640,
              height: 480,
            }}
          />
        {/* ) : null} */}
        <canvas
          ref={canvasRef}
          className='canvasContainer'
          style={{
            position: 'absolute',
            marginLeft: 'auto',
            marginRight: 'auto',
            left: 0,
            right: 0,
            textAlign: 'center',
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />
      </div>
      <div>
        {image !== '' ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              setImage('');
            }}
            className='webcam-btn'
          >
            Retake Image
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault();
              capture();
            }}
            className='webcam-btn'
          >
            Capture
          </button>
        )}
      </div>
      <div style={{marginTop: '500px'}}>
        <canvas
          ref={canvasResultRef}
          className='canvasContainer'
          style={{
            // position: 'absolute',
            // marginLeft: 'auto',
            // marginRight: 'auto',
            // left: 0,
            // right: 0,
            // textAlign: 'center',
            // zindex: 9,
            width: 640,
            height: 480,
          }}
        />
      </div>
    </div>
  );
};

export default App;
