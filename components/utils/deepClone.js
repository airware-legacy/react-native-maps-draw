export default function (obj = {}) {
  var clonedObj = {};
  try {
    clonedObj = JSON.parse(JSON.stringify(obj));
  } catch (e) {
    console.log(e);
  }
  return clonedObj;
}
