import { StyleSheet } from 'react-native';

export const colors = {
  background: '#F8F9F4',
  white: '#FFFFFF',
  ink: '#243C2D',
  muted: '#65725F',
  green: '#3D6246',
  lightGreen: '#EAF0DF',
  lime: '#D3E5A6',
  border: '#E2E7DC',
  orange: '#B86B34',
  lightOrange: '#FCF0E3',
  red: '#B84E40',
  lightRed: '#F9EAE4',
};
export const fonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
  serif: 'DMSerifDisplay_400Regular',
};
export const shared = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
  },
  label: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.6, color: colors.muted },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.muted },
});
