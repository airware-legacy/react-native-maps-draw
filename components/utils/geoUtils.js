import makePoint from 'turf-point';
import findMidpoint from 'turf-midpoint';
import findCenter from 'turf-center';
import deepClone from './deepClone';

const geoUtils = {
  calculateMidpoint(lowerBoundCoord, upperBoundCoord) {
    const feature = findMidpoint(
      makePoint([lowerBoundCoord.longitude, lowerBoundCoord.latitude]),
      makePoint([upperBoundCoord.longitude, upperBoundCoord.latitude]),
    );
    return {
      longitude: feature.geometry.coordinates[0],
      latitude: feature.geometry.coordinates[1],
    };
  },

  calculateOrigin(coordinates = []) {
    const center = findCenter({
      type: 'FeatureCollection',
      features: coordinates.map((c) => {
        if (c) {
          return makePoint([c.longitude, c.latitude]);
        }
      }),
    });
    return {
      longitude: center.geometry.coordinates[0],
      latitude: center.geometry.coordinates[1],
    };
  },

  add(origin, update) {
    return {
      longitude: origin.longitude + update.longitude,
      latitude: origin.latitude + update.latitude,
    };
  },

  diff(origin, update) {
    return {
      longitude: update.longitude - origin.longitude,
      latitude: update.latitude - origin.latitude,
    }
  },

  translate(coordinates, distanceCoord) {
    const diff = geoUtils.diff(geoUtils.calculateOrigin(coordinates), distanceCoord);

    let coords = deepClone(coordinates);
    for (let i = 0; i < coords.length; i++) {
      coords[i] = geoUtils.add(coords[i], diff);
    }

    return coords;
  },
};

export default geoUtils;
