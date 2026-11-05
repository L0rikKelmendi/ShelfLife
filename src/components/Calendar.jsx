import React, { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { ChevronLeft, ChevronRight, X } from './Icons';
import { dateKey, validDate } from '../lib/items';
import { colors, fonts, shared } from '../theme';
import { IconButton, Txt } from './UI';

export default function Calendar({ visible, value, onChange, onClose }) {
  const [month, setMonth] = useState(() => {
    const [y, m] = (validDate(value) ? value : dateKey()).split('-').map(Number);
    return new Date(y, m - 1, 1);
  });
  const y = month.getFullYear();
  const m = month.getMonth();
  const blanks = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [
    ...Array(blanks).fill(null),
    ...Array.from({ length: days }, (_, index) => index + 1),
  ];
  while (cells.length % 7) cells.push(null);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: '#16251CB0',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 22,
        }}
      >
        <View
          accessibilityViewIsModal
          style={[shared.card, { width: '100%', maxWidth: 360, padding: 20 }]}
        >
          <View style={shared.between}>
            <Txt serif style={{ fontSize: 25 }}>
              Pick a date
            </Txt>
            <IconButton label="Close calendar" icon={X} onPress={onClose} />
          </View>
          <View style={[shared.between, { marginVertical: 12 }]}>
            <IconButton
              icon={ChevronLeft}
              label="Previous month"
              disabled={y <= 2000 && m === 0}
              onPress={() => setMonth(new Date(y, m - 1, 1))}
            />
            <Txt style={{ fontFamily: fonts.bold }}>
              {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Txt>
            <IconButton
              icon={ChevronRight}
              label="Next month"
              disabled={y >= 2100 && m === 11}
              onPress={() => setMonth(new Date(y, m + 1, 1))}
            />
          </View>
          <View style={{ flexDirection: 'row' }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <View
                key={index}
                style={{ width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 10 }}
              >
                <Txt muted style={{ fontSize: 11 }}>
                  {day}
                </Txt>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {cells.map((day, index) => {
              const key = day ? dateKey(new Date(y, m, day)) : '';
              const selected = key === value;
              return (
                <View key={index} style={{ width: `${100 / 7}%`, padding: 2 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={key}
                    accessibilityState={{ selected }}
                    disabled={!day}
                    onPress={() => {
                      onChange(key);
                      onClose();
                    }}
                    style={{
                      aspectRatio: 1,
                      borderRadius: 11,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selected
                        ? colors.green
                        : key === dateKey()
                          ? colors.lightGreen
                          : 'transparent',
                    }}
                  >
                    <Txt style={{ color: selected ? '#fff' : colors.ink, fontSize: 13 }}>
                      {day || ''}
                    </Txt>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
