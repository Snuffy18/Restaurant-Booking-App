import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import {
  FloorPlanConfig,
  FloorPlanState,
  TableConfig,
  TableStatus,
  getCompatibleTables,
  getTableStatus,
} from './floorPlanTypes';

const COLOURS = {
  available: { bg: '#FAEEDA', border: '#EF9F27', text: '#633806', chair: '#FAC775' },
  taken: { bg: '#F1EFE8', border: '#D3D1C7', text: '#B4B2A9', chair: '#D3D1C7' },
  selected: { bg: '#EF9F27', border: '#BC5A13', text: '#FFFFFF', chair: '#F9CB42' },
  ai_pick: { bg: '#F9CB42', border: '#EF9F27', text: '#633806', chair: '#FCE08A' },
  yours: { bg: '#FFE9CC', border: '#EF9F27', text: '#633806', chair: '#F9CB42' },
  blocked: { bg: '#F1EFE8', border: '#D3D1C7', text: '#B4B2A9', chair: '#D3D1C7' },
  incompatible: { opacity: 0.3 },
  canvas: '#F5F3EE',
  wall: '#D3D1C7',
  partition: '#E0DDDA',
  zone_label: 'rgba(0,0,0,0.18)',
  grid_line: 'rgba(0,0,0,0.04)',
  outdoor_dash: '#C4BFB0',
};

interface FloorPlanMapProps {
  config: FloorPlanConfig;
  state: FloorPlanState;
  onTableSelect: (tableId: string) => void;
  onTableDeselect: () => void;
  mapHeight?: number;
}

function useScale(config: FloorPlanConfig, mapWidth: number) {
  return useMemo(() => mapWidth / config.canvasWidth, [mapWidth, config.canvasWidth]);
}

function px(logical: number, scale: number) {
  return logical * scale;
}

interface TableProps {
  table: TableConfig;
  status: TableStatus;
  scale: number;
  isIncompatible: boolean;
  onPress: () => void;
}

const Table: React.FC<TableProps> = ({ table, status, scale, isIncompatible, onPress }) => {
  const colours = COLOURS[status];
  const isTappable = status !== 'taken' && status !== 'blocked' && !isIncompatible;
  const isRound = table.shape === 'round';

  const tableWidth = px(table.width, scale);
  const tableHeight = px(table.height, scale);
  const tableX = px(table.x, scale);
  const tableY = px(table.y, scale);
  const chairSize = Math.max(5, px(22, scale));
  const chairOffset = Math.max(3, px(8, scale));

  const chairCount = Math.min(table.maxCapacity, 8);
  const chairsPerSide = Math.ceil(chairCount / 2);
  const chairSpacing = tableWidth / (chairsPerSide + 1);

  const chairStyle = {
    width: chairSize,
    height: chairSize,
    borderRadius: isRound ? chairSize / 2 : 2,
    backgroundColor: colours.chair,
    position: 'absolute' as const,
  };

  return (
    <Pressable
      onPress={isTappable ? onPress : undefined}
      style={[
        styles.table,
        {
          left: tableX,
          top: tableY,
          width: tableWidth,
          height: tableHeight,
          backgroundColor: colours.bg,
          borderColor: colours.border,
          borderRadius: isRound ? tableWidth / 2 : px(16, scale),
          opacity: isIncompatible ? COLOURS.incompatible.opacity : 1,
        },
      ]}>
      {Array.from({ length: chairsPerSide }).map((_, i) => (
        <View
          key={`top-${i}`}
          style={[
            chairStyle,
            {
              top: -chairSize - chairOffset,
              left: chairSpacing * (i + 1) - chairSize / 2,
            },
          ]}
        />
      ))}

      {Array.from({ length: chairsPerSide }).map((_, i) => (
        <View
          key={`bot-${i}`}
          style={[
            chairStyle,
            {
              bottom: -chairSize - chairOffset,
              left: chairSpacing * (i + 1) - chairSize / 2,
            },
          ]}
        />
      ))}

      <Text style={[styles.tableLabel, { color: colours.text, fontSize: Math.max(8, px(28, scale)) }]}>{table.label}</Text>

      {status === 'ai_pick' && (
        <View
          style={[
            styles.aiStar,
            { width: px(36, scale), height: px(36, scale), borderRadius: px(18, scale), top: -px(18, scale), right: -px(8, scale) },
          ]}>
          <Text style={{ fontSize: Math.max(7, px(20, scale)), color: 'white' }}>★</Text>
        </View>
      )}
    </Pressable>
  );
};

export const FloorPlanMap: React.FC<FloorPlanMapProps> = ({
  config,
  state,
  onTableSelect,
  onTableDeselect,
  mapHeight = 360,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const mapWidth = screenWidth;
  const scale = useScale(config, mapWidth);

  const compatibleTableIds = useMemo(() => new Set(getCompatibleTables(config.tables, state.partySize)), [config.tables, state.partySize]);

  const baseScale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTransX = useSharedValue(0);
  const savedTransY = useSharedValue(0);

  const MIN_SCALE = 1;
  const MAX_SCALE = 3;

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      baseScale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    })
    .onEnd(() => {
      savedScale.value = baseScale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTransX.value + e.translationX;
      translateY.value = savedTransY.value + e.translationY;
    })
    .onEnd(() => {
      savedTransX.value = translateX.value;
      savedTransY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      baseScale.value = withSpring(1);
      savedScale.value = 1;
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      savedTransX.value = 0;
      savedTransY.value = 0;
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: baseScale.value }, { translateX: translateX.value }, { translateY: translateY.value }],
  }));

  const handleTablePress = useCallback(
    (tableId: string) => {
      if (state.selectedTableId === tableId) onTableDeselect();
      else onTableSelect(tableId);
    },
    [state.selectedTableId, onTableSelect, onTableDeselect],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={composed}>
        <View style={[styles.canvas, { width: mapWidth, height: mapHeight, backgroundColor: COLOURS.canvas }]}>
          <Animated.View style={[{ width: mapWidth, height: mapHeight }, animatedStyle]}>
            {[0.25, 0.5, 0.75].map((ratio) => (
              <View key={`gh-${ratio}`} style={[styles.gridLineH, { top: mapHeight * ratio }]} />
            ))}
            {[0.25, 0.5, 0.75].map((ratio) => (
              <View key={`gv-${ratio}`} style={[styles.gridLineV, { left: mapWidth * ratio }]} />
            ))}

            {config.zones.map((zone) => (
              <Text
                key={zone.id}
                style={[
                  styles.zoneLabel,
                  {
                    left: px(zone.x + 16, scale),
                    top: px(zone.y + 16, scale),
                    fontSize: Math.max(8, px(22, scale)),
                    borderStyle: zone.isOutdoor ? 'dashed' : 'solid',
                  },
                ]}>
                {zone.label.toUpperCase()}
              </Text>
            ))}

            {config.zones
              .filter((z) => z.isOutdoor)
              .map((zone) => (
                <View
                  key={`outdoor-sep-${zone.id}`}
                  style={[
                    styles.outdoorSeparator,
                    {
                      top: px(zone.y - 8, scale),
                      left: px(zone.x, scale),
                      width: px(zone.width, scale),
                    },
                  ]}
                />
              ))}

            {config.walls.map((wall, i) => (
              <View
                key={`wall-${i}`}
                style={[
                  styles.wall,
                  {
                    left: px(wall.x, scale),
                    top: px(wall.y, scale),
                    width: px(wall.width, scale),
                    height: px(wall.height, scale),
                    backgroundColor: wall.type === 'solid' ? COLOURS.wall : COLOURS.partition,
                  },
                ]}
              />
            ))}

            {config.decorativeElements.map((el) => (
              <View
                key={el.id}
                style={[
                  styles.decorative,
                  {
                    left: px(el.x, scale),
                    top: px(el.y, scale),
                    width: px(el.width, scale),
                    height: px(el.height, scale),
                  },
                ]}>
                {el.label && <Text style={[styles.decorativeLabel, { fontSize: Math.max(7, px(20, scale)) }]}>{el.label}</Text>}
              </View>
            ))}

            {config.tables.map((table) => {
              const status = getTableStatus(table, state);
              const isIncompatible = !compatibleTableIds.has(table.id) && status !== 'taken' && status !== 'blocked';
              return (
                <Table
                  key={table.id}
                  table={table}
                  status={status}
                  scale={scale}
                  isIncompatible={isIncompatible}
                  onPress={() => handleTablePress(table.id)}
                />
              );
            })}

            {config.entrances.map((entrance, i) => (
              <View
                key={`entrance-${i}`}
                style={[
                  styles.entrance,
                  entrance.side === 'bottom' && {
                    bottom: 0,
                    left: mapWidth * entrance.offset - px(entrance.width / 2, scale),
                    width: px(entrance.width, scale),
                    height: 4,
                  },
                ]}>
                <Text style={[styles.entranceLabel, { fontSize: Math.max(7, px(20, scale)) }]}>▲ {entrance.label ?? 'Entrance'}</Text>
              </View>
            ))}

            <View style={styles.zoomHint}>
              <Text style={styles.zoomHintText}>Double tap to reset</Text>
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  canvas: {
    overflow: 'hidden',
    position: 'relative',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: COLOURS.grid_line,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: COLOURS.grid_line,
  },
  zoneLabel: {
    position: 'absolute',
    color: COLOURS.zone_label,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  outdoorSeparator: {
    position: 'absolute',
    height: 1,
    borderTopWidth: 1.5,
    borderTopColor: COLOURS.outdoor_dash,
    borderStyle: 'dashed',
  },
  wall: {
    position: 'absolute',
    borderRadius: 2,
  },
  decorative: {
    position: 'absolute',
    backgroundColor: '#D3D1C7',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorativeLabel: {
    color: '#888780',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  table: {
    position: 'absolute',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableLabel: {
    fontWeight: '500',
  },
  aiStar: {
    position: 'absolute',
    backgroundColor: '#EF9F27',
    borderWidth: 1.5,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entrance: {
    position: 'absolute',
    backgroundColor: COLOURS.canvas,
    borderTopWidth: 1.5,
    borderTopColor: COLOURS.outdoor_dash,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  entranceLabel: {
    position: 'absolute',
    bottom: -16,
    color: 'rgba(0,0,0,0.3)',
    letterSpacing: 0.3,
  },
  zoomHint: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  zoomHintText: {
    fontSize: 9,
    color: '#888',
  },
});

export default FloorPlanMap;
