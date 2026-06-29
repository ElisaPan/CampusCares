import { Platform } from 'react-native';


const modalBg = '#ffffff';
const modalBorder = '#e5e7eb';
const textColor = '#1f2937';
const iconColor = '#3b82f6';
const buttonHoverBg = 'rgba(59, 130, 246, 0.75)';
const lightOrange = '#ffcf6e';
const darkOrange = '#fda11c';
const red = '#cf1c25';
const darkRed = '#B31B1B';
const azure = '#4B5563';
const darkYellow = '#FAA018';

export const cornellRed = '#B31B1B'

export const themes = {
  attention: {
    backgroundColor: 'rgba(211, 211, 211, 0.298)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },

  attentionText: {
    fontSize: 11,
  },

  btnRed: {
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: modalBorder,
      backgroundColor: red,
    },
    btnRedText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '500',
    },
    btnRedPressed: {
      backgroundColor: 'rgba(179, 27, 27, 0.75)', // or use your red equivalent
    },

    btnDisabled: {
      opacity: 0.5,
    },
  clickableCard: {
    width: '100%',
    borderRadius: 12,
  },

  clickableCardPressed: {
    transform: [{ translateY: -2 }],
  },
  errorText: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  errorIcon: {
    fontSize: 15,
    color: red,
    marginRight: 5,
  },

  errorParagraph: {
    fontSize: 14,
    color: red,
  },

  termsFooter: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 12,
    marginBottom: 8,
    color: 'rgb(107 114 128)',
  },

  textInput: {
    // base input styles go here
  },

  textInputFocused: {
    borderColor: '#B31B1B',
    borderWidth: 2,
  },

  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 50,
  },

  modal: {
    maxWidth: 448,
    width: '100%',
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: modalBorder,
    backgroundColor: modalBg,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  closeIcon: {
    position: 'absolute',
    right: 10,
    top: 10,
  },

  modalContent: {
    marginLeft: 12,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  popupIconHeader: {
    paddingTop: 10,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: textColor,
    paddingTop: 5,
    textAlign: 'center',
  },

  modalMessage: {
    marginTop: 8,
    fontSize: 14,
    color: textColor,
    textAlign: 'center',
  },

  modalActions: {
    marginTop: 16,
    flexDirection: 'column',
    alignItems: 'center',
  },

  modalActionGap: {
    marginBottom: 7,
  },

  redBtn: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: modalBorder,
    backgroundColor: red,
  },

  redBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },

  modalActionText: {
    fontSize: 12,
  },

  campusCaresBanner: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 40,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#c41e1e',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  bannerContent: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bannerContentGap: {
    marginRight: 16,
  },

  bannerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },

  bannerBadgeTextSmall: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  bannerBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  bannerLinkPressed: {
    opacity: 0.9,
  },
}

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: azure,
    tabIconSelected: darkRed,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: azure,
    tabIconSelected: darkRed,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
