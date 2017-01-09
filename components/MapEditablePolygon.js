import React, { PropTypes } from 'react';
import { View, Platform } from 'react-native';
import MapView from 'react-native-maps';
import geoUtils from './utils/geoUtils';
import markerUtils from './utils/markerUtils';
import deepClone from './utils/deepClone';

const IS_ANDROID = Platform.OS === 'android';

class MapEditablePolygon extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      vertices: [],
      midpointVertices: [],
      update: Date.now(),
      coordinates: this.props.coordinates || [],
    };
  }

  onVertexDragStart(vertexPosition, coordinate) {
    var lowerPosition = vertexPosition - 1;
    var upperPosition = vertexPosition;

    if (vertexPosition === 0) {
      lowerPosition = 0;
      upperPosition = this.state.coordinates.length - 1;
    }

    const props = { opacity: 0, coordinate: IS_ANDROID ? coordinate : null };
    this.state.midpointVertices[lowerPosition].setNativeProps(props);
    this.state.midpointVertices[upperPosition].setNativeProps(props);

    if (this.props.onEditStart) {
      this.props.onEditStart(vertexPosition, this.getCoordinates());
    }
  }

  onVertexDrag(vertexPosition, coordinate) {
    const coordinates = Object.assign([], this.state.coordinates);
    coordinates[vertexPosition] = coordinate;
    this.setState({ coordinates: coordinates });
    this.polygon.setNativeProps({ coordinates: coordinates });

    if (this.props.onEdit) {
      this.props.onEdit(vertexPosition, coordinates);
    }
  }

  onVertexDragEnd(vertexPosition, coordinate) {
    const coordCount = this.state.coordinates.length - 1;

    var lowerPosition, upperPosition;
    var lowerMidpointCoord, upperMidpointCoord;

    if (vertexPosition === 0) {
      // coords lower(N - 1), middle(0), upper(1)
      lowerMidpointCoord = geoUtils.calculateMidpoint(this.state.coordinates[coordCount], coordinate);
      upperMidpointCoord = geoUtils.calculateMidpoint(coordinate, this.state.coordinates[1]);
      lowerPosition = coordCount;
      upperPosition = 0;
    } else if (vertexPosition === coordCount) {
      // coords lower(N - 2), middle(N - 1), upper(0)
      lowerMidpointCoord = geoUtils.calculateMidpoint(this.state.coordinates[coordCount - 1], coordinate);
      upperMidpointCoord = geoUtils.calculateMidpoint(coordinate, this.state.coordinates[0]);
      lowerPosition = coordCount - 1;
      upperPosition = coordCount;
    } else {
      // coords lower(cur - 1), middle(cur), upper(cur + 1)
      lowerMidpointCoord = geoUtils.calculateMidpoint(this.state.coordinates[vertexPosition - 1], coordinate);
      upperMidpointCoord = geoUtils.calculateMidpoint(coordinate, this.state.coordinates[vertexPosition + 1]);
      lowerPosition = vertexPosition - 1;
      upperPosition = vertexPosition;
    }

    this.state.midpointVertices[lowerPosition].setNativeProps({ coordinate: lowerMidpointCoord, opacity: 1 });
    this.state.midpointVertices[upperPosition].setNativeProps({ coordinate: upperMidpointCoord, opacity: 1 });

    const coords = this.getCoordinates();
    coords.splice(vertexPosition, 0, coordinate);

    // calculate new center
    if (this.props.draggable) {
      this.refs.center.setNativeProps({ coordinate: geoUtils.calculateOrigin(coords) });
    }

    if (this.props.onEditEnd) {
      this.props.onEditEnd(vertexPosition, coords);
    }
  }

  onVertexDelete(position) {
    if (this.state.coordinates.length > 3) {
      const coordinates = this.getCoordinates();
      coordinates.splice(position, 1);
      this.setState({ coordinates: coordinates, update: Date.now() });

      // calculate new center
      if (this.props.draggable) {
        this.refs.center.setNativeProps({ coordinate: geoUtils.calculateOrigin(coordinates) });
      }

      if (this.props.onEditEnd) {
        this.props.onEditEnd(coordinates);
      }
    }
  }

  onMidpointVertexDrag(vertexPosition, coordinate) {
    const coordinates = this.getCoordinates();
    coordinates.splice(vertexPosition + 1, 0, coordinate);
    this.polygon.setNativeProps({ coordinates: coordinates });
  }

  onMidpointVertexDragEnd(vertexPosition, coordinate) {
    const coordinates = this.getCoordinates();
    coordinates.splice(vertexPosition + 1, 0, coordinate);
    this.setState({ coordinates: coordinates, update: Date.now() });

    // calculate new center
    if (this.props.draggable) {
      this.refs.center.setNativeProps({ coordinate: geoUtils.calculateOrigin(coordinates) });
    }

    if (this.props.onEditEnd) {
      this.props.onEditEnd(vertexPosition, coordinates);
    }
  }

  onPolygonDragStart(coordinate) {
    const hideVertex = (v) => {
      if (v) {
        v.setNativeProps({
          opacity: 0,
          coordinate: IS_ANDROID ? undefined : null, // prevents weird drag animation on iOS(gmaps)
        });
      }
    };
    this.state.vertices.forEach(hideVertex);
    this.state.midpointVertices.forEach(hideVertex);
  }

  onPolygonDrag(coordinate) {
    const translatedCoords = geoUtils.translate(this.getCoordinates(), coordinate);
    this.polygon.setNativeProps({ coordinates: translatedCoords });
    this.setState({ coordinates: translatedCoords });
  }

  onPolygonDragEnd(coordinate) {
    this.setState({ update: Date.now() })
  }

  getCoordinates() {
    return deepClone(this.state.coordinates);
  }

  getCenterOffsetFromAnchor(scalar = 1) {
    return markerUtils.getCenterOffsetFromAnchor(
      this.props.vertexAnchor.x,
      this.props.vertexAnchor.y,
      this.props.vertexSize.width,
      this.props.vertexSize.height,
      scalar,
    );
  }

  renderVertices() {
    const { width, height } = this.props.vertexSize;
    const vertices = [];

    this.state.coordinates.forEach((coord, vertexPosition) => {
      const style = {
        width: width,
        height: height,
        borderRadius: width,
        backgroundColor: 'black',
        borderWidth: 3,
        borderColor: 'white',
      };
      vertices.push(
        <MapView.Marker
          draggable
          ref={ref => { this.state.vertices[vertexPosition] = ref; }}
          key={`${this.props.id}-vertex-${vertexPosition}`}
          coordinate={coord}
          centerOffset={this.getCenterOffsetFromAnchor()}
          anchor={this.props.vertexAnchor}
          zIndex={this.props.zIndex + 1}
          onDragStart={() => this.onVertexDragStart(vertexPosition)}
          onDrag={(e) => this.onVertexDrag(vertexPosition, e.nativeEvent.coordinate)}
          onDragEnd={(e) => this.onVertexDragEnd(vertexPosition, e.nativeEvent.coordinate)}
          onPress={() => this.onVertexDelete(vertexPosition)}>
          <View
            ref={`vertex-${vertexPosition}`}
            style={style}></View>
        </MapView.Marker>
      );
    });

    return vertices;
  }

  renderMidpointVertices() {
    const { width, height } = this.props.vertexSize;
    const midpointVertices = [];

    this.state.coordinates.forEach((coord, vertexPosition) => {
      let midpointCoord;

      if (vertexPosition < this.state.coordinates.length - 1) {
        midpointCoord = geoUtils.calculateMidpoint(
          coord,
          this.state.coordinates[vertexPosition + 1],
        );
      } else {
        midpointCoord = geoUtils.calculateMidpoint(
          coord,
          this.state.coordinates[0],
        );
      }

      const style = {
        width: width / 2,
        height: height / 2,
        borderRadius: width / 2,
        backgroundColor: 'grey',
        borderWidth: 3,
        borderColor: 'black',
      };

      midpointVertices.push(
        <MapView.Marker
          draggable
          ref={ref => { this.state.midpointVertices[vertexPosition] = ref; }}
          key={`${this.props.id}-midpoint-vertex-${vertexPosition}`}
          coordinate={midpointCoord}
          centerOffset={this.getCenterOffsetFromAnchor(0.5)}
          anchor={this.props.vertexAnchor}
          zIndex={this.props.zIndex + 1}
          onDrag={(e) => this.onMidpointVertexDrag(vertexPosition, e.nativeEvent.coordinate)}
          onDragEnd={(e) => this.onMidpointVertexDragEnd(vertexPosition, e.nativeEvent.coordinate)}>
          <View
            ref={`midpoint-vertex-${vertexPosition}`}
            style={style}></View>
        </MapView.Marker>
      );
    });

    return midpointVertices;
  }

  renderDragIcon() {
    if (!this.props.draggable) {
      return null;
    }

    return (
      <MapView.Marker
        draggable
        ref="center"
        coordinate={geoUtils.calculateOrigin(this.state.coordinates)}
        onDragStart={(e) => this.onPolygonDragStart(e.nativeEvent.coordinate)}
        onDrag={(e) => this.onPolygonDrag(e.nativeEvent.coordinate)}
        onDragEnd={(e) => this.onPolygonDragEnd(e.nativeEvent.coordinate)} />
    );
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.state.update !== nextState.update;
  }

  render() {
    return (
      <View key={this.state.update}>
        <MapView.Polygon
          ref={ref => { this.polygon = ref; }}
          key={`${this.props.id}-editable-polygon`}
          zIndex={this.props.zIndex}
          coordinates={this.state.coordinates}
          {...this.props.shapeStyle} />

        {this.renderVertices()}
        {this.renderMidpointVertices()}
        {this.renderDragIcon()}
      </View>
    );
  }
}

MapEditablePolygon.propTypes = {
  id: PropTypes.string,
  draggable: PropTypes.bool,
  coordinates: PropTypes.array,
  onEditStart: PropTypes.func,
  onEdit: PropTypes.func,
  onEditEnd: PropTypes.func,
  zIndex: PropTypes.number,
  shapeStyle: PropTypes.object,
  vertexAnchor: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  vertexSize: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
  }),
};

MapEditablePolygon.defaultProps = {
  id: '' + Date.now(),
  coordinates: [],
  draggable: true,
  zIndex: 1,
  shapeStyle: {
    strokeColor: 'white',
    fillColor: 'rgba(0, 0, 0, 0)',
    strokeWidth: 3,
  },
  vertexAnchor: {
    x: 0.5,
    y: 0.5,
  },
  vertexSize: {
    width: 30,
    height: 30,
  },
};

module.exports = MapEditablePolygon;
