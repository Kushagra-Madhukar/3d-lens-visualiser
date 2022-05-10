import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import Webcam from 'react-webcam';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import './App.scss';
import { drawMesh, drawBoundaries, drawEyesBig } from './utilities_new';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import skyblueLens from './images/skyblueLens.png'
import redLens from './images/redLens.png'
// import '@tensorflow/tfjs-backend-wasm';

const App = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasResultRef = useRef();
  const [image, setImage] = useState('');
  const [currentColor, setCurrentColor] = useState(skyblueLens);
  const [sources, setSources] = useState({leftEye: currentColor, rightEye: currentColor})

  const capture = useCallback(() => {
    const imgSrc = webcamRef.current.getScreenshot();
    console.log(currentColor, 'clcolor')
    setImage(imgSrc)
    // setSources({
    //   leftEye: currentColor,
    //   rightEye: currentColor,
    // //   mainImage: imgSrc
    // })
  }, [webcamRef.current, currentColor]);

  useEffect(() => {
    setSources({leftEye: currentColor, rightEye: currentColor})
    return () => {
      
    }
  }, [currentColor])
  

//   async function predictions(image){
//     await tf.setBackend('cpu');
//     let model = await faceLandmarksDetection.load(
//         faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
//         {maxFaces: 1});
//     const faces = await model.estimateFaces({ input: image });
//     return faces
//   }
    const face = useRef(null);
  // load facemesh
  const runFaceMesh = async (model) => {
    // console.log('runFaceMesh')
    async function loadImages(sources, callback) {
      var images = {};
      var loadedImages = 0;
      var numImages = 0;
      for(var src in sources) {
        numImages++;
      }
    //   console.log(numImages, sources, 'scs')
      for(var src in sources) {
        images[src] = new Image();
        // console.log(images, loadedImages, numImages, 'images');
        images[src].onload = await function() {
          if(++loadedImages >= numImages) {
            callback(images)
          }
        };
        images[src].src = sources[src];
      }
    }
    loadImages(sources, editVideo);
    function editVideo(images) {
        console.log('EditVideo', images, interval.current);
        if(interval.current) clearInterval(interval.current);
        interval.current = setInterval(() => {
            detect(model, images)
        }, 100);
    }
    function editImage(images) {
    //   console.log('editImage', model)
        detect(model, images);
    }
  };

  const detect = async (net, images) => {
    if (webcamRef.current === null || canvasResultRef.current === null) return;
    if (
      typeof webcamRef.current !== 'undefined' &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
    //   console.log('detect')
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth || 640;
      const videoHeight = webcamRef.current.video.videoHeight || 480;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

    //   canvasResultRef.current.width = videoWidth;
    //   canvasResultRef.current.height = videoHeight
      const canvas = canvasResultRef.current;
      const ctx = canvas.getContext('2d');
    //   const face0 = await net.estimateFaces({input: video});

      try {
        face.current = await net.estimateFaces({input: video});
        // face.current = await net.estimateFaces(video);
      } catch (err) {
        console.log('error...', err);
        // throw err;
      } finally {
        // console.log(face);
        // get canvas context for drawing
        // console.log('promise resolved part 2 bencho...');
        // const ctx = canvas.getContext('2d');
        ctx.canvas.width = videoWidth;
        ctx.canvas.height = videoHeight
        // ctx.canvas.width = 640;
        //   ctx.canvas.height = 480;
        // console.log("finally");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
            // ctx.save();
        // drawEyesBig(face.current, ctx, video)
        ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
        drawMesh(face.current, ctx, images, canvas, video);
        // ctx.save()
        
        // ctx.restore()
        
        // ctx.restore()
        drawBoundaries(face.current, ctx);
      }
    //   drawMesh(face0, ctx, images, canvas);
    }
  };

//   const model = useMemo(async() => {
//     await tf.setBackend('cpu');
//     const model = await faceLandmarksDetection.load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {maxFaces: 1});
//     return model
//   }, []);
  
//   useEffect(() => {
//     model.then((mdl) => {
//       console.log(mdl, 'mdl')
//       if(sources.mainImage) {
//         runFaceMesh(mdl);
//       }
//     }).catch(err => console.log(err))
//     return () => {
//     }
//   }, [sources.mainImage]);

  const interval = useRef()
  useEffect(() => {
    async function startRunning() {
        let mdl;
        try {
            // await tf.setBackend('webgl');
            if(!mdl) mdl = await faceLandmarksDetection.load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {maxFaces: 1});
            // return model
            // mdl = await model
            // mdl = await facemesh.load({
            //     inputResolution: { width: 640, height: 480 },
            //     scale: 0.8,
            //   });
            console.log(mdl)
        } catch (err) {
            console.log('err', err);
        } finally {
            // interval.current = setInterval(() => {
            runFaceMesh(mdl);
            // }, 100);
        }
    }
    if(sources.leftEye && sources.rightEye) startRunning();
    return () => {
      clearInterval(interval.current);
    }
  }, [sources.leftEye, sources.rightEye, image])
  
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
            muted={false}
            // style={{
              // position: 'absolute',
            //   marginLeft: 'auto',
            //   marginRight: 'auto',
            //   // left: 0,
            //   right: '100%',
            //   textAlign: 'center',
            //   zindex: 9,
            //   width: 640,
            //   height: 480,
            // }}
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
    </div>
  );
};

export default App;
