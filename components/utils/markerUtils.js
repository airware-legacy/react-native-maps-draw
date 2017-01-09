const markerUtils = {
  getCenterOffsetFromAnchor(x, y, width, height, scalar) {
    width = width * scalar;
    height = height * scalar;
    return {
      x: (width * 0.5) - (width * x),
      y: (height * 0.5) - (height * y),
    };
  }
};

export default markerUtils;
