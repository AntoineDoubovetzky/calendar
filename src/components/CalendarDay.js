// @flow

import React, { PureComponent } from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  active: boolean,
  selected: boolean,
  deselected: boolean,
  first: boolean,
  last: boolean,
  number: number,
};

export default class CalendarDay extends PureComponent<Props> {
  render() {
    const { active, selected, deselected, first, last, number } = this.props;
    let dayContainerStyle;

    if (!active && !selected && !deselected) {
      dayContainerStyle = styles.dayContainer;
    } else {
      if (deselected) dayContainerStyle = [styles.dayContainer, { backgroundColor: 'red' }];
      else if (selected) dayContainerStyle = [styles.dayContainer, { backgroundColor: 'green' }];
      else if (active) dayContainerStyle = [styles.dayContainer, { backgroundColor: 'blue' }];

      if (first) {
        dayContainerStyle.push(styles.firstActiveDayContainer);
      }
      if (last) {
        dayContainerStyle.push(styles.lastActiveDayContainer);
      }
    }
    return (
      <View style={dayContainerStyle}>
        <Text>{number}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  dayContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginVertical: 10,
  },
  firstActiveDayContainer: {
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  lastActiveDayContainer: {
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
});
