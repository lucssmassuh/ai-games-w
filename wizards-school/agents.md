# Magic Wand - Agents Documentation

## Overview
This document outlines the architecture and components of the Magic Wand gesture recognition system. The application uses TensorFlow.js and the Fingerpose library to detect and interpret hand gestures in real-time from a webcam feed.

## Core Components

### 1. Gesture Detection Agent
- **Purpose**: Detects hand landmarks and classifies gestures
- **Technologies**: TensorFlow.js HandPose model, Fingerpose library
- **Key Features**:
  - Real-time hand tracking
  - Gesture classification (thumbs up, victory sign, thumbs down)
  - Confidence scoring for detected gestures

### 2. UI Manager
- **Purpose**: Handles the user interface and visualization
- **Components**:
  - Video feed display
  - Gesture probability table
  - Visual feedback for detected gestures
- **Features**:
  - Real-time visualization of hand landmarks
  - Confidence score display
  - Responsive layout

### 3. Gesture Library
- **Location**: `fingerpose_combinations.js`
- **Purpose**: Defines gesture configurations and combinations
- **Included Gestures**:
  - Thumbs up
  - Victory sign
  - Thumbs down

## Data Flow
1. Webcam captures video frames
2. HandPose model processes each frame to detect hand landmarks
3. Fingerpose library analyzes landmarks to identify gestures
4. UI updates with detection results and confidence scores

## Dependencies
- TensorFlow.js
- Fingerpose library
- HandPose model

## Setup and Usage
1. Open `index.html` in a modern web browser
2. Grant camera permissions when prompted
3. Perform gestures in view of the webcam
4. View detection results in real-time

## Extension Points
1. Add new gestures by extending the Fingerpose configurations
2. Implement custom actions triggered by specific gestures
3. Enhance visualization with additional UI feedback

## Performance Considerations
- Runs entirely in the browser using WebGL acceleration
- Optimized for real-time performance
- Adjustable frame rate and resolution settings
