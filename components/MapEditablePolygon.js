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

  setNativeProps(props = {}) {
    if (props.shape) {
      this._setNativeShapeProps(props.shape);
    }

    if (props.vertex) {
      this._setNativeVertexProps(props.vertex);
    }

    if (props.midpointVertex) {
      this._setNativeMidpointVertexProps(props.midpointVertex)
    }
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
    coords.splice(vertexPosition, 1, coordinate);

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
        this.props.onEditEnd(position, coordinates);
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

  getCenterOffsetFromAnchor(anchor, size, scalar = 1) {
    return markerUtils.getCenterOffsetFromAnchor(
      anchor.x,
      anchor.y,
      size.width,
      size.height,
      scalar,
    );
  }

  renderVertices() {
    const vertices = [];

    this.state.coordinates.forEach((coord, vertexPosition) => {
      const baseStyle = {
        ...this.props.vertexSize,
      }

      const customStyle = this.props.vertexStyle || {
        borderRadius: this.props.vertexSize.width,
        backgroundColor: 'black',
        borderWidth: 3,
        borderColor: 'white',
      };

      const style = [baseStyle, customStyle]

      vertices.push(
        <MapView.Marker
          draggable
          ref={ref => { this.state.vertices[vertexPosition] = ref; }}
          key={`${this.props.id}-vertex-${vertexPosition}`}
          coordinate={coord}
          centerOffset={this.getCenterOffsetFromAnchor(this.props.vertexAnchor, this.props.vertexSize)}
          anchor={this.props.vertexAnchor}
          zIndex={this.props.zIndex + 1}
          onDragStart={() => this.onVertexDragStart(vertexPosition)}
          onDrag={(e) => this.onVertexDrag(vertexPosition, e.nativeEvent.coordinate)}
          onDragEnd={(e) => this.onVertexDragEnd(vertexPosition, e.nativeEvent.coordinate)}
          onPress={() => this.onVertexDelete(vertexPosition)}>
          <View ref={`vertex-${vertexPosition}`} style={style}>
              {this.props.renderVertex ? this.props.renderVertex() : null}
            </View>
        </MapView.Marker>
      );
    });

    return vertices;
  }

  renderMidpointVertices() {
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

      const baseStyle = {
        ...this.props.midpointVertexSize,
      };

      const customStyle = this.props.midpointVertexStyle || {
        borderRadius: this.props.midpointVertexSize.width,
        backgroundColor: 'grey',
        borderWidth: 3,
        borderColor: 'black',
      };

      const style = [baseStyle, customStyle];

      midpointVertices.push(
        <MapView.Marker
          draggable
          ref={ref => { this.state.midpointVertices[vertexPosition] = ref; }}
          key={`${this.props.id}-midpoint-vertex-${vertexPosition}`}
          coordinate={midpointCoord}
          centerOffset={this.getCenterOffsetFromAnchor(this.props.midpointVertexAnchor, this.props.midpointVertexSize, 0.5)}
          anchor={this.props.vertexAnchor}
          zIndex={this.props.zIndex + 1}
          onDrag={(e) => this.onMidpointVertexDrag(vertexPosition, e.nativeEvent.coordinate)}
          onDragEnd={(e) => this.onMidpointVertexDragEnd(vertexPosition, e.nativeEvent.coordinate)}>
          <View ref={`midpoint-vertex-${vertexPosition}`} style={style}>
            {this.props.renderMidpointVertex ? this.props.renderMidpointVertex() : null}
          </View>
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

  _setNativeShapeProps(props) {
    this.polygon.setNativeProps(props)
  }

  _setNativeVertexProps(props) {
    this.state.vertices.forEach((marker, vertexPosition) => {
      const iconView = this.refs[`vertex-${vertexPosition}`];
      if (iconView) {
        iconView.setNativeProps(props);
      }
    });
  }

  _setNativeMidpointVertexProps(props) {
    this.state.midpointVertices.forEach((marker, vertexPosition) => {
      const iconView = this.refs[`midpoint-vertex-${vertexPosition}`];
      if (iconView) {
        iconView.setNativeProps(props);
      }
    });
  }
}

MapEditablePolygon.DEFAULT_VERTEX_SIZE = 30;

MapEditablePolygon.propTypes = {
  id: PropTypes.string,
  draggable: PropTypes.bool,
  coordinates: PropTypes.array,
  onEditStart: PropTypes.func,
  onEdit: PropTypes.func,
  onEditEnd: PropTypes.func,
  zIndex: PropTypes.number,
  shapeStyle: PropTypes.object,
  vertexStyle: PropTypes.object,
  midpointVertexStyle: PropTypes.object,
  renderVertex: PropTypes.func,
  renderMidpointVertex: PropTypes.func,
  vertexAnchor: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  midpointVertexAnchor: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  vertexSize: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
  }),
  midpointVertexSize: PropTypes.shape({
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
  midpointVertexAnchor: {
    x: 0.5,
    y: 0.5,
  },
  vertexSize: {
    width: MapEditablePolygon.DEFAULT_VERTEX_SIZE,
    height: MapEditablePolygon.DEFAULT_VERTEX_SIZE,
  },
  midpointVertexSize: {
    width: MapEditablePolygon.DEFAULT_VERTEX_SIZE / 2,
    height: MapEditablePolygon.DEFAULT_VERTEX_SIZE / 2,
  },
};

module.exports = MapEditablePolygon;
