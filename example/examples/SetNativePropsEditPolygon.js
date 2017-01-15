import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity
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
  buttonBar: {
    width: 300,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 45,
    marginBottom: 30,
  },
  button: {
    width: 90,
    height: 45,
    backgroundColor: '#fbfbfb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowRadius: 1,
    shadowOpacity: 0.35,
    shadowColor: 'black',
  },
});

const baseVertex = {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'blue',
};

class SetNativePropsEditPolygon extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      region: {
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      },
      shapeColor: 'blue',
    };

    this.onRedShape = this.onRedShape.bind(this);
    this.onBlueShape = this.onBlueShape.bind(this);
  }

  onRedShape() {
    this.refs.editablePolygon.setNativeProps({
      shape: {
        strokeColor: 'red',
      },
      vertex: {
        style: {
          ...baseVertex,
          borderRadius: 30,
          backgroundColor: 'red',
        }
      },
      midpointVertex: {
        style: {
          ...baseVertex,
          borderRadius: 15,
          backgroundColor: 'red',
        },
      },
    });
    this.setState({ shapeColor: 'red' })
  }

  onBlueShape() {
    this.refs.editablePolygon.setNativeProps({
      shape: {
        strokeColor: 'blue',
      },
      vertex: {
        style: {
          ...baseVertex,
          borderRadius: 30,
          backgroundColor: 'blue',
        },
      },
      midpointVertex: {
        style: {
          ...baseVertex,
          borderRadius: 15,
          backgroundColor: 'blue',
        },
      },
    });
    this.setState({ shapeColor: 'blue' });
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
        ...baseVertex,
        borderRadius: 30,
        backgroundColor: this.state.shapeColor,
      },
      midpointVertexSize: {
        width: 30,
        height: 30,
      },
      midpointVertexStyle: {
        ...baseVertex,
        borderRadius: 15,
        backgroundColor: this.state.shapeColor,
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
            ref="editablePolygon"
            zIndex={3}
            shapeStyle={{ strokeColor: this.state.shapeColor, strokeWidth: 3, fillColor: 'transparent' }}
            vertexStyle={markerProps.vertexStyle}
            vertexSize={markerProps.vertexSize}
            midpointVertexSize={markerProps.midpointVertexSize}
            midpointVertexStyle={markerProps.midpointVertexStyle}
            key="editable-polygon"
            coordinates={location} />
        </MapView>

        <View style={styles.buttonBar}>
          <TouchableOpacity onPress={this.onBlueShape}>
            <View style={styles.button}>
              <Text>Blue</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={this.onRedShape}>
            <View style={styles.button}>
              <Text>Red</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

SetNativePropsEditPolygon.propTypes = {
  provider: MapView.ProviderPropType,
};

module.exports = SetNativePropsEditPolygon;
