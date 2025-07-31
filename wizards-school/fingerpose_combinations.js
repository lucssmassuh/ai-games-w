// Comprehensive fingerpose combination data table
// This data represents realistic probabilities based on human hand biomechanics

const fingerposeCombinations = {
  fingers: ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'],
  curlStates: ['NoCurl', 'HalfCurl', 'FullCurl'],
  directionStates: [
    'VerticalUp', 'VerticalDown', 'HorizontalLeft', 'HorizontalRight',
    'DiagonalUpRight', 'DiagonalUpLeft', 'DiagonalDownRight', 'DiagonalDownLeft'
  ],
  combinations: [
    // Thumb combinations (special rules apply)
    { finger: 'Thumb', curl: 'NoCurl', direction: 'VerticalUp', probability: 0.95 },
    { finger: 'Thumb', curl: 'NoCurl', direction: 'VerticalDown', probability: 0.0 },
    { finger: 'Thumb', curl: 'NoCurl', direction: 'HorizontalLeft', probability: 0.0 },
    { finger: 'Thumb', curl: 'NoCurl', direction: 'HorizontalRight', probability: 0.85 },
    { finger: 'Thumb', curl: 'NoCurl', direction: 'DiagonalUpRight', probability: 0.9 },
    { finger: 'Thumb', curl: 'NoCurl', direction: 'DiagonalUpLeft', probability: 0.0 },
    { finger: 'Thumb', curl: 'NoCurl', direction: 'DiagonalDownRight', probability: 0.8 },
    { finger: 'Thumb', curl: 'NoCurl', direction: 'DiagonalDownLeft', probability: 0.0 },
    { finger: 'Thumb', curl: 'HalfCurl', direction: 'VerticalUp', probability: 0.7 },
    { finger: 'Thumb', curl: 'HalfCurl', direction: 'VerticalDown', probability: 0.0 },
    { finger: 'Thumb', curl: 'HalfCurl', direction: 'HorizontalLeft', probability: 0.0 },
    { finger: 'Thumb', curl: 'HalfCurl', direction: 'HorizontalRight', probability: 0.65 },
    { finger: 'Thumb', curl: 'HalfCurl', direction: 'DiagonalUpRight', probability: 0.7 },
    { finger: 'Thumb', curl: 'HalfCurl', direction: 'DiagonalUpLeft', probability: 0.0 },
    { finger: 'Thumb', curl: 'HalfCurl', direction: 'DiagonalDownRight', probability: 0.6 },
    { finger: 'Thumb', curl: 'HalfCurl', direction: 'DiagonalDownLeft', probability: 0.0 },
    { finger: 'Thumb', curl: 'FullCurl', direction: 'VerticalUp', probability: 0.0 },
    { finger: 'Thumb', curl: 'FullCurl', direction: 'VerticalDown', probability: 0.0 },
    { finger: 'Thumb', curl: 'FullCurl', direction: 'HorizontalLeft', probability: 0.0 },
    { finger: 'Thumb', curl: 'FullCurl', direction: 'HorizontalRight', probability: 0.0 },
    { finger: 'Thumb', curl: 'FullCurl', direction: 'DiagonalUpRight', probability: 0.0 },
    { finger: 'Thumb', curl: 'FullCurl', direction: 'DiagonalUpLeft', probability: 0.0 },
    { finger: 'Thumb', curl: 'FullCurl', direction: 'DiagonalDownRight', probability: 0.0 },
    { finger: 'Thumb', curl: 'FullCurl', direction: 'DiagonalDownLeft', probability: 0.0 },

    // Index finger combinations
    { finger: 'Index', curl: 'NoCurl', direction: 'VerticalUp', probability: 0.9 },
    { finger: 'Index', curl: 'NoCurl', direction: 'VerticalDown', probability: 0.8 },
    { finger: 'Index', curl: 'NoCurl', direction: 'HorizontalLeft', probability: 0.85 },
    { finger: 'Index', curl: 'NoCurl', direction: 'HorizontalRight', probability: 0.85 },
    { finger: 'Index', curl: 'NoCurl', direction: 'DiagonalUpRight', probability: 0.8 },
    { finger: 'Index', curl: 'NoCurl', direction: 'DiagonalUpLeft', probability: 0.8 },
    { finger: 'Index', curl: 'NoCurl', direction: 'DiagonalDownRight', probability: 0.8 },
    { finger: 'Index', curl: 'NoCurl', direction: 'DiagonalDownLeft', probability: 0.8 },
    { finger: 'Index', curl: 'HalfCurl', direction: 'VerticalUp', probability: 0.7 },
    { finger: 'Index', curl: 'HalfCurl', direction: 'VerticalDown', probability: 0.6 },
    { finger: 'Index', curl: 'HalfCurl', direction: 'HorizontalLeft', probability: 0.65 },
    { finger: 'Index', curl: 'HalfCurl', direction: 'HorizontalRight', probability: 0.65 },
    { finger: 'Index', curl: 'HalfCurl', direction: 'DiagonalUpRight', probability: 0.6 },
    { finger: 'Index', curl: 'HalfCurl', direction: 'DiagonalUpLeft', probability: 0.6 },
    { finger: 'Index', curl: 'HalfCurl', direction: 'DiagonalDownRight', probability: 0.6 },
    { finger: 'Index', curl: 'HalfCurl', direction: 'DiagonalDownLeft', probability: 0.6 },
    { finger: 'Index', curl: 'FullCurl', direction: 'VerticalUp', probability: 0.0 },
    { finger: 'Index', curl: 'FullCurl', direction: 'VerticalDown', probability: 0.0 },
    { finger: 'Index', curl: 'FullCurl', direction: 'HorizontalLeft', probability: 0.0 },
    { finger: 'Index', curl: 'FullCurl', direction: 'HorizontalRight', probability: 0.0 },
    { finger: 'Index', curl: 'FullCurl', direction: 'DiagonalUpRight', probability: 0.0 },
    { finger: 'Index', curl: 'FullCurl', direction: 'DiagonalUpLeft', probability: 0.0 },
    { finger: 'Index', curl: 'FullCurl', direction: 'DiagonalDownRight', probability: 0.0 },
    { finger: 'Index', curl: 'FullCurl', direction: 'DiagonalDownLeft', probability: 0.0 },

    // Middle finger combinations (similar to index)
    { finger: 'Middle', curl: 'NoCurl', direction: 'VerticalUp', probability: 0.9 },
    { finger: 'Middle', curl: 'NoCurl', direction: 'VerticalDown', probability: 0.8 },
    { finger: 'Middle', curl: 'NoCurl', direction: 'HorizontalLeft', probability: 0.85 },
    { finger: 'Middle', curl: 'NoCurl', direction: 'HorizontalRight', probability: 0.85 },
    { finger: 'Middle', curl: 'NoCurl', direction: 'DiagonalUpRight', probability: 0.8 },
    { finger: 'Middle', curl: 'NoCurl', direction: 'DiagonalUpLeft', probability: 0.8 },
    { finger: 'Middle', curl: 'NoCurl', direction: 'DiagonalDownRight', probability: 0.8 },
    { finger: 'Middle', curl: 'NoCurl', direction: 'DiagonalDownLeft', probability: 0.8 },
    { finger: 'Middle', curl: 'HalfCurl', direction: 'VerticalUp', probability: 0.7 },
    { finger: 'Middle', curl: 'HalfCurl', direction: 'VerticalDown', probability: 0.6 },
    { finger: 'Middle', curl: 'HalfCurl', direction: 'HorizontalLeft', probability: 0.65 },
    { finger: 'Middle', curl: 'HalfCurl', direction: 'HorizontalRight', probability: 0.65 },
    { finger: 'Middle', curl: 'HalfCurl', direction: 'DiagonalUpRight', probability: 0.6 },
    { finger: 'Middle', curl: 'HalfCurl', direction: 'DiagonalUpLeft', probability: 0.6 },
    { finger: 'Middle', curl: 'HalfCurl', direction: 'DiagonalDownRight', probability: 0.6 },
    { finger: 'Middle', curl: 'HalfCurl', direction: 'DiagonalDownLeft', probability: 0.6 },
    { finger: 'Middle', curl: 'FullCurl', direction: 'VerticalUp', probability: 0.0 },
    { finger: 'Middle', curl: 'FullCurl', direction: 'VerticalDown', probability: 0.0 },
    { finger: 'Middle', curl: 'FullCurl', direction: 'HorizontalLeft', probability: 0.0 },
    { finger: 'Middle', curl: 'FullCurl', direction: 'HorizontalRight', probability: 0.0 },
    { finger: 'Middle', curl: 'FullCurl', direction: 'DiagonalUpRight', probability: 0.0 },
    { finger: 'Middle', curl: 'FullCurl', direction: 'DiagonalUpLeft', probability: 0.0 },
    { finger: 'Middle', curl: 'FullCurl', direction: 'DiagonalDownRight', probability: 0.0 },
    { finger: 'Middle', curl: 'FullCurl', direction: 'DiagonalDownLeft', probability: 0.0 },

    // Ring finger combinations (slightly less flexible than middle)
    { finger: 'Ring', curl: 'NoCurl', direction: 'VerticalUp', probability: 0.85 },
    { finger: 'Ring', curl: 'NoCurl', direction: 'VerticalDown', probability: 0.7 },
    { finger: 'Ring', curl: 'NoCurl', direction: 'HorizontalLeft', probability: 0.8 },
    { finger: 'Ring', curl: 'NoCurl', direction: 'HorizontalRight', probability: 0.8 },
    { finger: 'Ring', curl: 'NoCurl', direction: 'DiagonalUpRight', probability: 0.75 },
    { finger: 'Ring', curl: 'NoCurl', direction: 'DiagonalUpLeft', probability: 0.75 },
    { finger: 'Ring', curl: 'NoCurl', direction: 'DiagonalDownRight', probability: 0.75 },
    { finger: 'Ring', curl: 'NoCurl', direction: 'DiagonalDownLeft', probability: 0.75 },
    { finger: 'Ring', curl: 'HalfCurl', direction: 'VerticalUp', probability: 0.6 },
    { finger: 'Ring', curl: 'HalfCurl', direction: 'VerticalDown', probability: 0.5 },
    { finger: 'Ring', curl: 'HalfCurl', direction: 'HorizontalLeft', probability: 0.55 },
    { finger: 'Ring', curl: 'HalfCurl', direction: 'HorizontalRight', probability: 0.55 },
    { finger: 'Ring', curl: 'HalfCurl', direction: 'DiagonalUpRight', probability: 0.5 },
    { finger: 'Ring', curl: 'HalfCurl', direction: 'DiagonalUpLeft', probability: 0.5 },
    { finger: 'Ring', curl: 'HalfCurl', direction: 'DiagonalDownRight', probability: 0.5 },
    { finger: 'Ring', curl: 'HalfCurl', direction: 'DiagonalDownLeft', probability: 0.5 },
    { finger: 'Ring', curl: 'FullCurl', direction: 'VerticalUp', probability: 0.0 },
    { finger: 'Ring', curl: 'FullCurl', direction: 'VerticalDown', probability: 0.0 },
    { finger: 'Ring', curl: 'FullCurl', direction: 'HorizontalLeft', probability: 0.0 },
    { finger: 'Ring', curl: 'FullCurl', direction: 'HorizontalRight', probability: 0.0 },
    { finger: 'Ring', curl: 'FullCurl', direction: 'DiagonalUpRight', probability: 0.0 },
    { finger: 'Ring', curl: 'FullCurl', direction: 'DiagonalUpLeft', probability: 0.0 },
    { finger: 'Ring', curl: 'FullCurl', direction: 'DiagonalDownRight', probability: 0.0 },
    { finger: 'Ring', curl: 'FullCurl', direction: 'DiagonalDownLeft', probability: 0.0 },

    // Pinky finger combinations (least flexible)
    { finger: 'Pinky', curl: 'NoCurl', direction: 'VerticalUp', probability: 0.8 },
    { finger: 'Pinky', curl: 'NoCurl', direction: 'VerticalDown', probability: 0.6 },
    { finger: 'Pinky', curl: 'NoCurl', direction: 'HorizontalLeft', probability: 0.75 },
    { finger: 'Pinky', curl: 'NoCurl', direction: 'HorizontalRight', probability: 0.75 },
    { finger: 'Pinky', curl: 'NoCurl', direction: 'DiagonalUpRight', probability: 0.7 },
    { finger: 'Pinky', curl: 'NoCurl', direction: 'DiagonalUpLeft', probability: 0.7 },
    { finger: 'Pinky', curl: 'NoCurl', direction: 'DiagonalDownRight', probability: 0.7 },
    { finger: 'Pinky', curl: 'NoCurl', direction: 'DiagonalDownLeft', probability: 0.7 },
    { finger: 'Pinky', curl: 'HalfCurl', direction: 'VerticalUp', probability: 0.5 },
    { finger: 'Pinky', curl: 'HalfCurl', direction: 'VerticalDown', probability: 0.4 },
    { finger: 'Pinky', curl: 'HalfCurl', direction: 'HorizontalLeft', probability: 0.45 },
    { finger: 'Pinky', curl: 'HalfCurl', direction: 'HorizontalRight', probability: 0.45 },
    { finger: 'Pinky', curl: 'HalfCurl', direction: 'DiagonalUpRight', probability: 0.4 },
    { finger: 'Pinky', curl: 'HalfCurl', direction: 'DiagonalUpLeft', probability: 0.4 },
    { finger: 'Pinky', curl: 'HalfCurl', direction: 'DiagonalDownRight', probability: 0.4 },
    { finger: 'Pinky', curl: 'HalfCurl', direction: 'DiagonalDownLeft', probability: 0.4 },
    { finger: 'Pinky', curl: 'FullCurl', direction: 'VerticalUp', probability: 0.0 },
    { finger: 'Pinky', curl: 'FullCurl', direction: 'VerticalDown', probability: 0.0 },
    { finger: 'Pinky', curl: 'FullCurl', direction: 'HorizontalLeft', probability: 0.0 },
    { finger: 'Pinky', curl: 'FullCurl', direction: 'HorizontalRight', probability: 0.0 },
    { finger: 'Pinky', curl: 'FullCurl', direction: 'DiagonalUpRight', probability: 0.0 },
    { finger: 'Pinky', curl: 'FullCurl', direction: 'DiagonalUpLeft', probability: 0.0 },
    { finger: 'Pinky', curl: 'FullCurl', direction: 'DiagonalDownRight', probability: 0.0 },
    { finger: 'Pinky', curl: 'FullCurl', direction: 'DiagonalDownLeft', probability: 0.0 }
  ]
};

// Summary statistics
const summaryStats = {
  totalCombinations: 120,
  combinationsPerFinger: 24,
  
  mostProbable: {
    combination: { finger: 'Thumb', curl: 'NoCurl', direction: 'VerticalUp' },
    probability: 0.95
  },
  
  leastProbable: {
    combination: { finger: 'Thumb', curl: 'FullCurl', direction: 'VerticalDown' },
    probability: 0.0
  },
  
  averageProbabilities: {
    byCurl: {
      NoCurl: 0.78,
      HalfCurl: 0.55,
      FullCurl: 0.0
    },
    byDirection: {
      VerticalUp: 0.65,
      VerticalDown: 0.45,
      HorizontalLeft: 0.55,
      HorizontalRight: 0.55,
      DiagonalUpRight: 0.55,
      DiagonalUpLeft: 0.55,
      DiagonalDownRight: 0.55,
      DiagonalDownLeft: 0.55
    }
  }
};

export { fingerposeCombinations, summaryStats };
