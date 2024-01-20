import { useRecoilValue } from "recoil";
import { painState } from "../../store/atom/currentpain";

import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import React, { useRef, useState, useEffect } from "react";
import backend from "@tensorflow/tfjs-backend-webgl";
import Webcam from "react-webcam";
import { count } from "../../utils/music";

import Instructions from "../../components/Instrctions/Instructions";

//import wtf from '../temp/'

import "../Yoga/Yoga.css";

import { poseImages } from "../../utils/pose_images";
import { POINTS, keypointConnections } from "../../utils/data";
import { drawPoint, drawSegment } from "../../utils/helper";

let skeletonColor = "rgb(255,255,255)";

let interval;

// flag variable is used to help capture the time when AI just detect
// the pose as correct(probability more than threshold)
let flag = false;

function Mainpain() {
  const pain = useRecoilValue(painState);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [startingTime, setStartingTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [poseTime, setPoseTime] = useState(0);
  const [currentposeIndex, setcurrentposeIndex] = useState(0);
  const [isPoseCorrect, setIsPoseCorrect] = useState(false);
  const [currentPose, setcurrentPose] = useState("Tree");
  const [isStartPose, setIsStartPose] = useState(false);

  //   useEffect(() => {
  //     setIsPoseCorrect(false);
  //     setCurrentTime(0)
  //     setPoseTime(0)
  //   }, [currentPose])

  useEffect(() => {
    const timeDiff = (currentTime - startingTime) / 1000;
    if (flag) {
      setPoseTime(timeDiff);
      console.log(timeDiff);
      if (timeDiff >= 10) {
        console.log("Condition met. Setting isPoseCorrect to true.");
        setIsPoseCorrect(() => {
          console.log("Updated isPoseCorrect: ");
          return true;
        });
      }
    }
  }, [currentTime, poseTime, startingTime]);

  useEffect(() => {
    if (isPoseCorrect && currentposeIndex < pain.poseList.length - 1) {
      console.log("startpose is called");
      startNextPose();
      
    }
  }, [isPoseCorrect, poseTime, currentposeIndex]);

  const startNextPose = () => {
    stopPose();
    setIsStartPose(true);
    setIsPoseCorrect(false);
    setcurrentposeIndex((prevIndex) => {
      // Use the callback form of setcurrentPose to ensure the latest state value
      setcurrentPose((prevPose) => {
        console.log("Previous pose: " + prevPose);
        
        console.log("Next pose: " + pain.poseList[++prevIndex]);
        return pain.poseList[prevIndex];
      });

      // Reset timer for the new pose
      setStartingTime(new Date(Date()).getTime());
      setCurrentTime(new Date(Date()).getTime());

      // Return the updated index
      
      return prevIndex ;
    });
    
    
  };
  useEffect(()=>{
    runMovenet();
    console.log("runmovenet started");
  },[currentPose,currentposeIndex])

  //  const startNextPose=()=>{
  //        setIsPoseCorrect(false);
  //        setcurrentposeIndex((prevIndex) => prevIndex + 1);
  //         setcurrentPose(pain.poseList[currentposeIndex]);
  //         console.log("startnextposeeeeeeee : "+pain.poseList[currentposeIndex])
  //        // Reset timer for the new pose
  //     setStartingTime(new Date(Date()).getTime());
  //     setCurrentTime(new Date(Date()).getTime());
  //    }


  const CLASS_NO = {
    Chair: 3,
    Cobra: 10,
    Dog: 8,
    No_Pose: 7,
    Shoulderstand: 4,
    Traingle: 5,
    Tree: 11,
    Warrior: 2,
    Crescent: 0,
  };

  function get_center_point(landmarks, left_bodypart, right_bodypart) {
    let left = tf.gather(landmarks, left_bodypart, 1);
    let right = tf.gather(landmarks, right_bodypart, 1);
    const center = tf.add(tf.mul(left, 0.5), tf.mul(right, 0.5));
    return center;
  }

  function get_pose_size(landmarks, torso_size_multiplier = 2.5) {
    let hips_center = get_center_point(
      landmarks,
      POINTS.LEFT_HIP,
      POINTS.RIGHT_HIP
    );
    let shoulders_center = get_center_point(
      landmarks,
      POINTS.LEFT_SHOULDER,
      POINTS.RIGHT_SHOULDER
    );
    let torso_size = tf.norm(tf.sub(shoulders_center, hips_center));
    let pose_center_new = get_center_point(
      landmarks,
      POINTS.LEFT_HIP,
      POINTS.RIGHT_HIP
    );
    pose_center_new = tf.expandDims(pose_center_new, 1);

    pose_center_new = tf.broadcastTo(pose_center_new, [1, 17, 2]);
    // return: shape(17,2)
    let d = tf.gather(tf.sub(landmarks, pose_center_new), 0, 0);
    let max_dist = tf.max(tf.norm(d, "euclidean", 0));

    // normalize scale
    let pose_size = tf.maximum(
      tf.mul(torso_size, torso_size_multiplier),
      max_dist
    );
    return pose_size;
  }

  function normalize_pose_landmarks(landmarks) {
    let pose_center = get_center_point(
      landmarks,
      POINTS.LEFT_HIP,
      POINTS.RIGHT_HIP
    );
    pose_center = tf.expandDims(pose_center, 1);
    pose_center = tf.broadcastTo(pose_center, [1, 17, 2]);
    landmarks = tf.sub(landmarks, pose_center);

    let pose_size = get_pose_size(landmarks);
    landmarks = tf.div(landmarks, pose_size);
    return landmarks;
  }

  function landmarks_to_embedding(landmarks) {
    // normalize landmarks 2D
    landmarks = normalize_pose_landmarks(tf.expandDims(landmarks, 0));
    let embedding = tf.reshape(landmarks, [1, 34]);
    return embedding;
  }

  //   
  const runMovenet = async () => {
    console.log("runmovenet")
    const detectorConfig = {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
    };
    const detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      detectorConfig
    );
    const poseClassifier = await tf.loadLayersModel(
      "http://localhost:5001/model"
    );
    // const response = await fetch('http://localhost:5000/model');
    //   console.log(response);

    //   let poseClassifier=0;
    //   fetch('http://localhost:5000/model')
    // .then(response => response.json())
    // .then(async (data) => {
    //   poseClassifier = await tf.loadLayersModel(data)
    //   console.log(poseClassifier);
    //   const countAudio = new Audio(count)
    //   countAudio.loop = true
    //   interval = setInterval(() => {
    //       detectPose(detector, poseClassifier, countAudio)
    //   }, 100)
    // })
    // .catch(error => console.error(error));

    //   console.log(typeof poseClassifier);
    const countAudio = new Audio(count);
    countAudio.loop = true;
    interval = setInterval(() => {
      detectPose(detector, poseClassifier, countAudio);
    }, 100);
  };

  const detectPose = async (detector, poseClassifier, countAudio) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      let notDetected = 0;
      const video = webcamRef.current.video;
      const pose = await detector.estimatePoses(video);
      //   console.log(pose)
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      try {
        const keypoints = pose[0].keypoints;

        let input = keypoints.map((keypoint) => {
          if (keypoint.score > 0.4) {
            if (
              !(keypoint.name === "left_eye" || keypoint.name === "right_eye")
            ) {
              drawPoint(ctx, keypoint.x, keypoint.y, 8, "rgb(255,255,255)");
              let connections = keypointConnections[keypoint.name];

              //   console.log(connections)
              try {
                connections.forEach((connection) => {
                  let conName = connection.toUpperCase();
                  drawSegment(
                    ctx,
                    [keypoint.x, keypoint.y],
                    [
                      keypoints[POINTS[conName]].x,
                      keypoints[POINTS[conName]].y,
                    ],
                    skeletonColor
                  );
                });
              } catch (err) {}
            }
          } else {
            notDetected += 1;
          }
          return [keypoint.x, keypoint.y];
        });
        if (notDetected > 4) {
          skeletonColor = "rgb(255,255,255)";
          return;
        }
        // console.log('process')
        const processedInput = landmarks_to_embedding(input);
        const classification = poseClassifier.predict(processedInput);
        // console.log('classifications: '+classification)

        classification.array().then((data) => {
          //   console.log(data)
          const classNo = CLASS_NO[currentPose];
          console.log("classno "+classNo);
          if (data[0][classNo] > 0.97) {
            if (!flag) {
              countAudio.play();
              setStartingTime(new Date(Date()).getTime());
              flag = true;
            }
            setCurrentTime(new Date(Date()).getTime());
            skeletonColor = "rgb(0,255,0)";
          } else {
            flag = false;
            skeletonColor = "rgb(255,255,255)";
            countAudio.pause();
            countAudio.currentTime = 0;
            // console.log("hello")
            // console.log("pose done for 10 secs"+isPoseCorrect)
          }
        });
      } catch (err) {
        console.log(err);
      }
    }
  };

  function startYoga() {
    setIsStartPose(true);
    setcurrentPose(pain.poseList[0]);
    setcurrentposeIndex(0);
    runMovenet();
  }

  function stopPose() {
    setIsStartPose(false);
    clearInterval(interval);
  }

  if (isStartPose) {
    return (
      <div className="yoga-container">
        <div className="performance-container">
          <div className="pose-performance">
            <h4>Pose Time: {poseTime} s</h4>
          </div>
        </div>
        <div>
          <Webcam
            width="640px"
            height="480px"
            id="webcam"
            ref={webcamRef}
            style={{
              position: "absolute",
              left: 120,
              top: 100,
              padding: "0px",
            }}
          />
          <canvas
            ref={canvasRef}
            id="my-canvas"
            width="640px"
            height="480px"
            style={{
              position: "absolute",
              left: 120,
              top: 100,
              zIndex: 1,
            }}
          ></canvas>
          <div>
            <img
              src={poseImages[currentPose]}
              alt="poseimage"
              className="pose-img"
            />
          </div>
        </div>
        <button onClick={stopPose} className="secondary-btn">
          Stop Pose
        </button>
      </div>
    );
  }

  return (
    <div className="yoga-container">
      {/* <div
        className='dropdown dropdown-container'
         
      >
        {/* <button 
            className="btn btn-secondary dropdown-toggle"
            type='button'
            data-bs-toggle="dropdown"
            id="pose-dropdown-btn"
            aria-expanded="false"
        >{pain.currentType}
        </button> */}
      {/* <ul class="dropdown-menu dropdown-custom-menu" aria-labelledby="dropdownMenuButton1">
            {typeList.map((pose) => (
                <li onClick={() => setCurrentType(pose)}>
                    <div class="dropdown-item-container">
                        <p className="dropdown-item-1">{pose}</p>
                        {/* <img 
                            src={poseImages[pose]}
                            className="dropdown-img"
                        /> */}
      {/*                         
                    </div>
                </li>
            ))}
            
        </ul> */}

      {/* </div>  */}

      {/* <Instructions
          currentPose={currentPose}
        /> */}
      <button onClick={startYoga} className="secondary-btn">
        Start Pose
      </button>
    </div>
  );
}

export default Mainpain;
