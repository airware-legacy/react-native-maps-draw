import EditPolygon from './EditPolygon';
import EditPolyline from './EditPolyline';
import CustomEditPolygonVertex from './CustomEditPolygonVertex';
import SetNativePropsEditPolygon from './SetNativePropsEditPolygon';

module.exports = [
  { name: 'Editable Polygon', Component: EditPolygon },
  { name: 'Editable Polyline', Component: EditPolyline },
  { name: 'Custom Polygon Vertex', Component: CustomEditPolygonVertex },
  { name: 'Set Native Props Edit Polygon', Component: SetNativePropsEditPolygon },
];
