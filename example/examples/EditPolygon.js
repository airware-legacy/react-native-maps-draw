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
});

class EditPolygon extends React.Component {
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

    return (
      <View style={styles.container}>
        <MapView
          provider={this.props.provider}
          style={styles.map}
          mapType={MapView.MAP_TYPES.HYBRID}
          initialRegion={this.state.region}>
          <EditablePolygon
            zIndex={3}
            key="editable-polygon"
            coordinates={[
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
              }
            ]} />
        </MapView>
      </View>
    );
  }
}

EditPolygon.propTypes = {
  provider: MapView.ProviderPropType,
};

module.exports = EditPolygon;
