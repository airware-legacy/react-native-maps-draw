import React, { PropTypes } from 'react';
import { View, Platform } from 'react-native';
import MapView from 'react-native-maps';
import geoUtils from './utils/geoUtils';
import markerUtils from './utils/markerUtils';
import deepClone from './utils/deepClone';

const IS_ANDROID = Platform.OS === 'android';

class MapEditablePolyline extends React.Component {
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
      lowerPosition = undefined;
      upperPosition = vertexPosition;
    } else if (vertexPosition === this.state.coordinates.length - 1) {
      lowerPosition = this.state.coordinates.length - 2;
      upperPosition = undefined;
    }

    const props = { opacity: 0, coordinate: IS_ANDROID ? coordinate : null };

    if (typeof lowerPosition !== 'undefined') {
      this.state.midpointVertices[lowerPosition].setNativeProps(props);
    }

    if (typeof upperPosition !== 'undefined') {
      this.state.midpointVertices[upperPosition].setNativeProps(props);
    }

    if (this.props.onEditStart) {
      this.props.onEditStart(vertexPosition, this.getCoordinates());
    }
  }

  onVertexDrag(vertexPosition, coordinate) {
    const coordinates = Object.assign([], this.state.coordinates);
    coordinates[vertexPosition] = coordinate;
    this.setState({ coordinates: coordinates });
    this.polyline.setNativeProps({ coordinates: coordinates });

    if (this.props.onEdit) {
      this.props.onEdit(vertexPosition, coordinates);
    }
  }

  onVertexDragEnd(vertexPosition, coordinate) {
    const coordCount = this.state.coordinates.length - 1;

    var lowerPosition, upperPosition;
    var lowerMidpointCoord, upperMidpointCoord;

    if (vertexPosition === 0) {
      // coords middle(0), upper(1)
      upperMidpointCoord = geoUtils.calculateMidpoint(coordinate, this.state.coordinates[1]);
      upperPosition = 0;
    } else if (vertexPosition === coordCount) {
      // coords lower(N - 2), middle(N - 1)
      lowerMidpointCoord = geoUtils.calculateMidpoint(this.state.coordinates[coordCount - 1], coordinate);
      lowerPosition = coordCount - 1;
    } else {
      // coords lower(cur - 1), middle(cur), upper(cur + 1)
      lowerMidpointCoord = geoUtils.calculateMidpoint(this.state.coordinates[vertexPosition - 1], coordinate);
      upperMidpointCoord = geoUtils.calculateMidpoint(coordinate, this.state.coordinates[vertexPosition + 1]);
      lowerPosition = vertexPosition - 1;
      upperPosition = vertexPosition;
    }

    if (typeof lowerPosition !== 'undefined') {
      this.state.midpointVertices[lowerPosition].setNativeProps({
        coordinate: lowerMidpointCoord, opacity: 1
      });
    }

    if (typeof upperPosition !== 'undefined') {
      this.state.midpointVertices[upperPosition].setNativeProps({
        coordinate: upperMidpointCoord, opacity: 1
      });
    }

    const coords = this.getCoordinates();
    coords.splice(vertexPosition, 0, coordinate);

    if (this.props.onEditEnd) {
      this.props.onEditEnd(vertexPosition, coords);
    }
  }

  onVertexDelete(position) {
    if (this.state.coordinates.length > 2) {
      const coordinates = this.getCoordinates();
      coordinates.splice(position, 1);
      this.setState({ coordinates: coordinates, update: Date.now() });

      if (this.props.onEditEnd) {
        this.props.onEditEnd(coordinates);
      }
    }
  }

  onMidpointVertexDrag(vertexPosition, coordinate) {
    const coordinates = this.getCoordinates();
    coordinates.splice(vertexPosition + 1, 0, coordinate);
    this.polyline.setNativeProps({ coordinates: coordinates });
  }

  onMidpointVertexDragEnd(vertexPosition, coordinate) {
    const coordinates = this.getCoordinates();
    coordinates.splice(vertexPosition + 1, 0, coordinate);
    this.setState({ coordinates: coordinates, update: Date.now() });

    if (this.props.onEditEnd) {
      this.props.onEditEnd(vertexPosition, coordinates);
    }
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
      if (vertexPosition >= this.state.coordinates.length - 1) {
        return;
      }

      let midpointCoord = geoUtils.calculateMidpoint(
        coord,
        this.state.coordinates[vertexPosition + 1],
      );

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
          coordinate={midpointCoord || coord}
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
    // TODO: Should polylines be draggable?
    return null
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.state.update !== nextState.update;
  }

  render() {
    return (
      <View key={this.state.update}>
        <MapView.Polyline
          ref={ref => { this.polyline = ref; }}
          key={`${this.props.id}-editable-polyline`}
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

MapEditablePolyline.propTypes = {
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

MapEditablePolyline.defaultProps = {
  id: '' + Date.now(),
  coordinates: [],
  draggable: true,
  zIndex: 1,
  shapeStyle: {
    strokeColor: 'white',
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

module.exports = MapEditablePolyline;
