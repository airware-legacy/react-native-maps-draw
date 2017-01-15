import React from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';

import { EditablePolygon } from 'react-native-maps-draw';
import MapView from 'react-native-maps';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  vertex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'black',
  },
});

class CustomVertex extends React.Component {
  render() {
    return (
      <View style={styles.vertex}></View>
    )
  }
}

class CustomEditPolygonVertex extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      region: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
      polygons: [],
      editing: null,
      lastEdit: Date.now(),
    };
  }

  render() {
    const mapOptions = {
      scrollEnabled: true,
    };

    const location = [
      {
        "longitude": -122.4466556310654,
        "latitude": 37.80049676520799
      },
      {
        "longitude": -122.4117600917816,
        "latitude": 37.80118793389846
      },
      {
        "longitude": -122.4165702983737,
        "latitude": 37.78280419552875
      },
      {
        "longitude": -122.4418454244733,
        "latitude": 37.78674383953429
      },
    ];

    const markerProps = {
      vertexSize: {
        width: 60,
        height: 60,
      },
      vertexStyle: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 30,
        borderWidth: 2,
        borderColor: 'black',
        backgroundColor: 'yellow',
      },
      midpointVertexSize: {
        width: 30,
        height: 30,
      },
      midpointVertexStyle: {
        backgroundColor: 'yellow',
        borderWidth: 2,
        borderColor: 'black',
        borderRadius: 15,
      }
    };

    return (
      <View style={styles.container}>
        <MapView
          provider={this.props.provider}
          style={styles.map}
          mapType={MapView.MAP_TYPES.HYBRID}
          initialRegion={this.state.region}>
          <EditablePolygon
            zIndex={3}
            shapeStyle={{ strokeColor: 'yellow', strokeWidth: 3, fillColor: 'transparent' }}
            vertexStyle={markerProps.vertexStyle}
            vertexSize={markerProps.vertexSize}
            midpointVertexSize={markerProps.midpointVertexSize}
            midpointVertexStyle={markerProps.midpointVertexStyle}
            renderVertex={() => <CustomVertex />}
            key="editable-polygon"
            coordinates={location} />
        </MapView>
      </View>
    );
  }
}

CustomEditPolygonVertex.propTypes = {
  provider: MapView.ProviderPropType,
};

module.exports = CustomEditPolygonVertex;
