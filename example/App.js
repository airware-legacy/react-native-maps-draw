import React from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import Examples from './examples';

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  switchCnt: {
    marginTop: 60,
    marginBottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 20,
    marginRight: 15,
  },
  list: {
    marginLeft: -30,
  },
  item: {
    padding: 30,
  },
});

const IS_ANDROID = Platform.OS === 'android';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      provider: PROVIDER_DEFAULT,
      Component: null,
    };
  }

  onProviderChange(useGoogleMaps) {
    this.setState({ provider: useGoogleMaps ? PROVIDER_GOOGLE : PROVIDER_DEFAULT });
  }

  renderProviderSwitch() {
    if (IS_ANDROID || this.state.Component) {
      return null;
    }
    return (
      <View style={styles.switchCnt}>
        <Text style={styles.switchText}>Use Google Maps?</Text>
        <Switch
          onValueChange={(useGoogleMaps) => this.onProviderChange(useGoogleMaps)}
          value={this.state.provider === PROVIDER_GOOGLE} />
      </View>
    );
  }

  renderExampleListItem(example, key) {
    return (
      <TouchableOpacity key={key} onPress={() => this.setState({ Component: example.Component })}>
        <View style={styles.item}>
          <Text>{example.name}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  renderExampleList() {
    if (this.state.Component) {
      return null;
    }
    const items = Examples.map((example, key) => {
      return this.renderExampleListItem(example, key);
    });
    return (
      <ScrollView>
        {items}
      </ScrollView>
    );
  }

  renderComponent() {
    if (!this.state.Component) {
      return null;
    }
    return <this.state.Component provider={this.state.provider} />;
  }

  render() {
    return (
      <View style={styles.root}>
        {this.renderComponent()}
        {this.renderProviderSwitch()}
        {this.renderExampleList()}
      </View>
    );
  }
}

module.exports = App;
