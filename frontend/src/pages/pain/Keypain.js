import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { count } from "../../utils/music";

//import wtf from '../temp/'

import "../Yoga/Yoga.css";
import { poseImages } from "../../utils/pose_images";
import { POINTS, keypointConnections } from "../../utils/data";
import { drawPoint, drawSegment } from "../../utils/helper";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { painState } from "../../store/atom/currentpain";
import  {currentposeState }from "../../store/atom/currentpose";
let skeletonColor = "rgb(255,255,255)";

let interval;

const countAudio = new Audio(count);
// flag variable is used to help capture the time when AI just detect
// the pose as correct(probability more than threshold)
let flag = false;

function Keypain() {
  const pain = useRecoilValue(painState);
  const pose = useRecoilValue(currentposeState);
  console.log("currentpose " + pose.currentPose);
  const setcurrentpose = useSetRecoilState(currentposeState);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [startingTime, setStartingTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [poseTime, setPoseTime] = useState(0);
  const [isStartPose, setIsStartPose] = useState(false);
  const [isPoseCorrect, setisPoseCorrect] = useState(false);
  const [currentposeIndex, setcurrentposeIndex] = useState(0);
  let poseList = pain.poseList;
  let currentpose=pose.currentPose;

  const startNextPose = () => {
    setisPoseCorrect(false);
    setPoseTime(0);
    runMovenet();
    setIsStartPose(true);
    setStartingTime(new Date(Date()).getTime());
    setCurrentTime(new Date(Date()).getTime());
  };

  useEffect(() => {
    if (isPoseCorrect && currentposeIndex < poseList.length - 1) {
        countAudio.pause();
        countAudio.currentTime = 0;
      startNextPose();
    }
  }, [isPoseCorrect, currentposeIndex]);

  useEffect(() => {
    const timeDiff = (currentTime - startingTime) / 1000;
    if (flag) {
      setPoseTime(timeDiff);
      if (timeDiff >= 5) {
        setcurrentpose({
            currentPose:poseList[currentposeIndex + 1]});
        setcurrentposeIndex((prev) => {
          return prev + 1;
        });
        stopPose();
        setisPoseCorrect(true);
      }
    }
  }, [currentTime]);

//   useEffect(() => {
//     setCurrentTime(0);
//     setPoseTime(0);
//   }, [currentpose]);

  const CLASS_NO = {
    Chair: 3,
    Cobra: 1,
    Dog: 2,
    No_Pose: 8,
    Shoulderstand: 4,
    Traingle: 5,
    Tree: 11,
    Warrior: 7,
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

  const runMovenet = async () => {
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

    // console.log(typeof poseClassifier);
    
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
      //   console.log(pose);
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      try {
        const keypoints = pose[0].keypoints;
        // console.log("201");
        let input = keypoints.map((keypoint) => {
          if (keypoint.score > 0.4) {
            if (
              !(keypoint.name === "left_eye" || keypoint.name === "right_eye")
            ) {
              drawPoint(ctx, keypoint.x, keypoint.y, 8, "rgb(255,255,255)");
              let connections = keypointConnections[keypoint.name];
              //   console.log("207");
              //   console.log(connections);
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
        // console.log("process");
        const processedInput = landmarks_to_embedding(input);
        const classification = poseClassifier.predict(processedInput);
        // console.log("classifications: " + classification);

        classification.array().then((data) => {
          console.log("classNo " + currentpose);
          const classNo = CLASS_NO[currentpose];
          //   console.log(data[0][classNo]);
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
          }
        });
      } catch (err) {
        console.log(err);
      }
    }
  };

  function startYoga() {
    setIsStartPose(true);
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
            <img src={poseImages[currentpose]} className="pose-img" />
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
      <button onClick={startYoga} className="secondary-btn">
        Start Pose
      </button>
    </div>
  );
}

export default Keypain;
