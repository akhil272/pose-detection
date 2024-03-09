"use client";
import { useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import Webcam from "react-webcam";

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // load pose detection models
  const runPoseDetection = async () => {
    await tf.ready();
    const detectorConfig = {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    };
    const detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      detectorConfig
    );

    setInterval(() => {
      detect(detector);
    }, 100);
  };

  const detect = async (detector: poseDetection.PoseDetector) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video?.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // set video
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      //make detections
      const poses = await detector.estimatePoses(video);
      console.log(poses);
      drawCanvas(poses, video, videoWidth, videoHeight, canvasRef);
    }
  };

  const drawCanvas = (
    poses: poseDetection.Pose[],
    video: HTMLVideoElement,
    videoWidth: number,
    videoHeight: number,
    canvas: any
  ) => {
    const ctx = canvas.current.getContext("2d");
    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;
    // Clear canvas
    ctx.clearRect(0, 0, videoWidth, videoHeight);

    // Draw keypoints and skeleton
    poses.forEach((pose) => {
      const keypoints = pose.keypoints;
      // Draw keypoints
      keypoints.forEach((keypoint) => {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
      });

      // Draw skeleton
      const adjacentKeyPoints = [
        ["left_shoulder", "right_shoulder"],
        ["left_shoulder", "left_elbow"],
        ["right_shoulder", "right_elbow"],
        ["left_elbow", "left_wrist"],
        ["right_elbow", "right_wrist"],
        ["left_hip", "right_hip"],
        ["left_shoulder", "left_hip"],
        ["right_shoulder", "right_hip"],
        ["left_hip", "left_knee"],
        ["right_hip", "right_knee"],
        ["left_knee", "left_ankle"],
        ["right_knee", "right_ankle"],
      ];

      adjacentKeyPoints.forEach((keyPointPair) => {
        const [keyPoint1, keyPoint2] = keyPointPair;
        const kp1 = keypoints.find((kp) => kp.name === keyPoint1);
        const kp2 = keypoints.find((kp) => kp.name === keyPoint2);

        if (kp1 && kp2) {
          ctx.beginPath();
          ctx.moveTo(kp1.x, kp1.y);
          ctx.lineTo(kp2.x, kp2.y);
          ctx.strokeStyle = "green";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    });
  };

  runPoseDetection();

  return (
    <div className="p-4 relative">
      <h2>Pose Detections</h2>
      <Webcam
        ref={webcamRef}
        audio={false}
        style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 9,
          width: "100%",
          height: 480,
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 9,
          width: "100%",
          height: 480,
        }}
      />
    </div>
  );
}
