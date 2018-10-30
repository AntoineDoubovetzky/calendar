// @flow

import React, { Component } from 'react';
import { View, FlatList, TouchableWithoutFeedback, PanResponder, Vibration } from 'react-native';

const LONG_PRESS_TIMEOUT = 500;
const VIBRATION_DURATION = 500;
const SCROLL_INCREMENTATION = 10;
const DISTANCE_BEFORE_MANUAL_SCROLL = 50;

type Props = {
  days: [],
  onSingleCellSelection: (cellIndex: number) => void,
  onMultiSelectionEnd: (selectionMode: string, selection: Array<number>) => void,
  renderCell: (cellItem: Object) => any,
  cellsPerRow: number,
};

type State = {
  multiSelectionMode: ?('select' | 'deselect'),
  initialSelectedCellIndex: ?number,
  currentSelection: Array<number>,
  cellLayout: {
    height: number,
    width: number,
  },
  calendarLayout: {
    height: number,
    width: number,
  },
  shouldScrollDown: boolean,
  shouldScrollUp: boolean,
  scrollOffset: number,
  maxScrollOffset: number,
};

export default class Calendar extends Component<Props, State> {
  panResponder;
  flatList;

  static defaultProps = {
    cellsPerRow: 7,
  };

  state = {
    multiSelectionMode: null,
    initialSelectedCellIndex: null,
    currentSelection: [],
    cellLayout: {
      height: 0,
      width: 0,
    },
    calendarLayout: {
      height: 0,
      width: 0,
    },
    shouldScrollUp: false,
    shouldScrollDown: false,
    scrollOffset: 0,
    maxScrollOffset: 1000,
  };

  componentDidUpdate() {
    const { shouldScrollUp, shouldScrollDown, scrollOffset, maxScrollOffset } = this.state;
    if (shouldScrollUp) {
      this.flatList.scrollToOffset({
        offset: Math.max(scrollOffset - SCROLL_INCREMENTATION, 0),
        animated: false,
      });
    } else if (shouldScrollDown) {
      const scrollOffsetValue = this.state.maxScrollOffset
        ? Math.min(scrollOffset + SCROLL_INCREMENTATION, maxScrollOffset)
        : scrollOffset + SCROLL_INCREMENTATION;

      this.flatList.scrollToOffset({
        offset: scrollOffsetValue,
        animated: false,
      });
    }
  }

  isCellActive = (cellIndex: number) => this.props.days[cellIndex].active;

  startMultiSelection = (cellIndex: number) => {
    const isCellAlreadyActive = this.isCellActive(cellIndex);
    this.setState({
      multiSelectionMode: isCellAlreadyActive ? 'deselect' : 'select',
      initialSelectedCellIndex: cellIndex,
    });

    Vibration.vibrate(VIBRATION_DURATION);
  };

  selectSingleCell = (cellIndex: number) => this.props.onSingleCellSelection(cellIndex);

  handlePanResponderEnd = nativeEvent => {
    this.setState({ shouldScrollDown: false, shouldScrollUp: false });
    if (this.state.multiSelectionMode) {
      this.props.onMultiSelectionEnd(this.state.multiSelectionMode, this.state.currentSelection);
      this.setState({
        multiSelectionMode: null,
        initialSelectedCellIndex: null,
        currentSelection: [],
      });
    }
  };

  findCellIndex = (locationX: number, locationY: number) => {
    const {
      initialSelectedCellIndex,
      cellLayout: { width, height },
    } = this.state;

    const cellToRight = Math.floor(locationX / width);
    const cellToBottom = Math.floor(locationY / height);

    const currentcellIndex =
      initialSelectedCellIndex + cellToRight + this.props.cellsPerRow * cellToBottom;
    return currentcellIndex;
  };

  handleMultiSelection = (locationX: number, locationY: number) => {
    const { initialSelectedCellIndex } = this.state;
    const currentcellIndex = this.findCellIndex(locationX, locationY);

    const startIndex = Math.max(Math.min(initialSelectedCellIndex, currentcellIndex), 0);
    const endIndex = Math.min(
      Math.max(initialSelectedCellIndex, currentcellIndex),
      this.props.days.length - 1
    );

    let currentSelection = [];
    for (let i = startIndex; i <= endIndex; i++) {
      currentSelection.push(i);
    }

    this.setState({ currentSelection });
  };

  handleScroll = (locationY: number) => {
    const calendarRelativePositionY =
      Math.floor(this.state.initialSelectedCellIndex / this.props.cellsPerRow) *
        this.state.cellLayout.height +
      locationY -
      this.state.scrollOffset;

    if (
      calendarRelativePositionY >
      this.state.calendarLayout.height - DISTANCE_BEFORE_MANUAL_SCROLL
    ) {
      this.setState({ shouldScrollDown: true });
    } else if (calendarRelativePositionY < DISTANCE_BEFORE_MANUAL_SCROLL) {
      this.setState({ shouldScrollUp: true });
    } else {
      this.setState({ shouldScrollDown: false, shouldScrollUp: false });
    }
  };

  componentWillMount() {
    this.panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: () => this.state.multiSelectionMode,
      onPanResponderMove: evt => {
        const { locationX, locationY } = evt.nativeEvent;

        this.handleMultiSelection(locationX, locationY);
        this.handleScroll(locationY);
      },
      onPanResponderTerminate: evt => this.handlePanResponderEnd(evt.nativeEvent),
      onPanResponderRelease: evt => this.handlePanResponderEnd(evt.nativeEvent),
    });
  }

  onFirstcellLayout = ({
    nativeEvent: {
      layout: { width, height },
    },
  }) => {
    this.setState({
      cellLayout: {
        height,
        width,
      },
    });
  };

  isCellSelected = index =>
    this.state.currentSelection.includes(index) && this.state.multiSelectionMode === 'select';

  isCellDeselected = index =>
    this.state.currentSelection.includes(index) && this.state.multiSelectionMode === 'deselect';

  renderCell = ({ index, item }) => {
    item.selected = this.isCellSelected(index);
    item.deselected = this.isCellDeselected(index);

    return (
      <TouchableWithoutFeedback
        onPress={() => this.selectSingleCell(index)}
        onLongPress={() => this.startMultiSelection(index)}
        delayLongPress={LONG_PRESS_TIMEOUT}
        onLayout={index === 0 ? this.onFirstcellLayout : () => {}}
      >
        <View style={{ flex: 1 }} pointerEvents="box-only">
          {this.props.renderCell(item)}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  onCalendarLayout = ({
    nativeEvent: {
      layout: { x, y, width, height },
    },
  }) => {
    this.setState({
      calendarLayout: {
        height,
        width,
      },
    });
  };

  onScroll = (event: Object) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const maxScrollOffset = contentSize.height - layoutMeasurement.height;
    this.setState({ maxScrollOffset, scrollOffset: contentOffset.y });
  };

  render() {
    const { days, cellsPerRow } = this.props;

    const renderedCells = days.map((item: Object, index: number) => {
      const renderedCell = {
        ...item,
        selected: this.isCellSelected(index),
        deselected: this.isCellDeselected(index),
        first: false,
        last: false,
      };

      if (renderedCell.active || renderedCell.selected || renderedCell.deselected) {
        if (
          index === 0 ||
          (!this.isCellSelected(index - 1) &&
            !this.isCellDeselected(index - 1) &&
            !days[index - 1].active)
        ) {
          renderedCell.first = true;
        }
        if (
          index === days.length - 1 ||
          (!this.isCellSelected(index + 1) &&
            !this.isCellDeselected(index + 1) &&
            !days[index + 1].active)
        ) {
          renderedCell.last = true;
        }
      }

      return renderedCell;
    });

    return (
      <View {...this.panResponder.panHandlers}>
        <FlatList
          ref={ref => (this.flatList = ref)}
          onLayout={this.onCalendarLayout}
          data={renderedCells}
          onScroll={this.onScroll}
          renderItem={this.renderCell}
          numColumns={cellsPerRow}
          keyExtractor={item => item.id.toString()}
          scrollEnabled={this.state.initialSelectedCellIndex === null}
        />
      </View>
    );
  }
}
