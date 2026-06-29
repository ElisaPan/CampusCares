/*************
 * TODO:
 *  Severe:
 *    Explore page
 *    Footer
 *  High:
 *    Update numbers
 *  Low
 *    -
 */
import helpIcon from '@/assets/icons/help.png';
import locationIcon from '@/assets/icons/location.png';
import profileCheckIcon from '@/assets/icons/profile-check.png';
import searchIcon from '@/assets/icons/search.png';
import childrensGarden from '@/assets/images/childrens-garden.png';
import cover1 from '@/assets/images/cover1.png';
import cover2 from '@/assets/images/cover2.jpg';
import cover3 from '@/assets/images/cover3.png';
import cover4 from '@/assets/images/cover4.jpg';
import cover5 from '@/assets/images/cover5.png';
import cover6 from '@/assets/images/cover6.jpg';
import heartImg from '@/assets/images/heart-img.png';
import mobilePack from '@/assets/images/mobile-pack.png';
import salvationArmy from '@/assets/images/salvation-army.jpg';
import secondWind from '@/assets/images/second-wind.jpg';
import tmBlockMB1 from '@/assets/images/tm-block-mb1.png';
import tmBlockMB2 from '@/assets/images/tm-block-mb2.png';
import tmBlock1 from '@/assets/images/tm-block1.png';
import tmBlock3 from '@/assets/images/tm-block3.png';

import HomeFooter from '@/components/HomeFooter';
import PublicHeader from '@/components/PublicHeaderComponent';
import * as Theme from '@/constants/theme';
import grace from '@/public/team_pic/grace.jpeg';
import lee from '@/public/team_pic/lee.png';
import scott from '@/public/team_pic/scott.png';

import AosView from '@/components/AOSView';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Pressable, Animated as RNAnimated, StyleSheet, Text, View } from 'react-native';

const HomePage = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [active, setActive] = useState(0);

  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const translateY = useRef(new RNAnimated.Value(-20)).current;
  
  const carouselRef = useRef<HTMLDivElement>(null);

  const icons = [searchIcon, profileCheckIcon, locationIcon, helpIcon];

  // Scroll Appear
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  // Slideshow
  const covers = [cover1, cover2, cover3, cover4, cover5, cover6];
  const { width: screenWidth, height } = Dimensions.get('window');
  const slideWidth = screenWidth * 0.9;
  const slideHeight = Math.round(slideWidth * 0.6);
  const slideInt = 3500;
  const gap = 0;

  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList<any>>(null);
  const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToSlide = useCallback((index: number) => {
    const next = index % covers.length;
    flatListRef.current?.scrollToIndex({ index: next, animated: true });
    setActiveSlide(next);
  }, []);

  useEffect(() => {
    slideTimer.current = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % covers.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, slideInt);
    return () => { if (slideTimer.current) clearInterval(slideTimer.current); };
  }, []);

  // Red & Yellow Grid
  const { height: screenHeight } = Dimensions.get("window");
  const [showRedGrid, setShowRedGrid] = useState(false);
  const [showYellowGrid, setShowYellowGrid] = useState(false);
  const redScale = useRef(new RNAnimated.Value(0.85)).current;
  const redOpacity = useRef(new RNAnimated.Value(0)).current;
  const yellowScale = useRef(new RNAnimated.Value(0.85)).current;
  const yellowOpacity = useRef(new RNAnimated.Value(0)).current;
  const redTriggered = useRef(false);
  const yellowTriggered = useRef(false);

  const redGridY = useRef(0);
  const yellowGridY = useRef(0);

  const animateRedGrid = () => {
    setTimeout(() => {
      RNAnimated.parallel([
      RNAnimated.timing(redScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      RNAnimated.timing(redOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    }, 300);
  };

  const animateYellowGrid = () => {
    setTimeout(() => {
      RNAnimated.parallel([
        RNAnimated.timing(yellowScale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        RNAnimated.timing(yellowOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, 900);
  };

  // Number Grids
  const [showNumGrid, setShowNumGrid] = useState(false);
  const numGridScale = useRef(new RNAnimated.Value(0.85)).current;
  const numGridOpacity = useRef(new RNAnimated.Value(0)).current;
  const numGridTriggered = useRef(false);

  const numGridY = useRef(0);

  const animateNumGrid = () => {
    setTimeout(() => {
      RNAnimated.parallel([
      RNAnimated.timing(numGridScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      RNAnimated.timing(numGridOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    }, 1400);
  };
  
  // Partner Carousel
  const [scrollNum, setScrollNum] = useState(0);
  const [maxScrollSteps, setMaxScrollSteps] = useState(0);
  const partnerListRef = useRef<FlatList<any>>(null);
  
  const carouselCardWidth = screenWidth * 0.75

  const handleScroll = (direction: "left" | "right") => {
    const next =
      direction === "left"
        ? Math.max(0, scrollNum - 1)
        : Math.min(partners.length - 1, scrollNum + 1);

    partnerListRef.current?.scrollToIndex({ index: next, animated: true });
    setScrollNum(next);
  };
  
  const tagStyles = StyleSheet.create({
    green: { backgroundColor: "rgba(24,120,40,0.1)" },
    purple: { backgroundColor: "rgba(111,27,179,0.1)" },
    blue: { backgroundColor: "rgba(45,27,179,0.1)" },
  });
  const tagTxtStyles = StyleSheet.create({
    green: { color: "#187828" },
    purple: { color: "#6F1BB3" },
    blue: { color: "#2D1BB3" },
  });

  useEffect(() => {
    if (partners.length > 0) {
      setMaxScrollSteps(partners.length - 1);
    }
  }, [partnerListRef]);

  useEffect(() => {
    fadeAnim.setValue(0);
    translateY.setValue(-20);
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      RNAnimated.timing(translateY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const partners = [
    {
      img: salvationArmy,
      tags: ['Food Insecurity'],
      title: 'Salvation Army of Ithaca',
      desc: 'Prepare and serve nourishing meals.'
    },
    {
      img: secondWind,
      tags: ['Housing Insecurity'],
      title: 'Second Wind Cottages',
      desc: 'Renovate homes for formerly homeless neighbors.'
    },
    {
      img: mobilePack,
      tags: ['Food Insecurity', 'Serve Children'],
      title: 'Ithaca Mobile Pack',
      desc: 'Package nutritious meals for children.'
    },
    {
      img: childrensGarden,
      tags: ['Serve Children'],
      title: "Ithaca Children's Garden",
      desc: 'Guide children through an obstacle course.'
    }
  ];

  const tags: Record<string, string> = {
    'Food Insecurity': 'green',
    'Housing Insecurity': 'purple',
    'Serve Children': 'blue'
  };

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % covers.length);
    }, 7000);

    return () => clearInterval(id);
  }, []);

  // Timeline
  function AnimatedConnector({ scrollY }: { scrollY: RNAnimated.Value }) {
    const viewRef   = useRef<View>(null);
    const opacity   = useRef(new RNAnimated.Value(0)).current;
    const triggered = useRef(false);

    useEffect(() => {
      const check = () => {
        viewRef.current?.measure((_x, _y, _w, _h, _px, pageY) => {
          if (pageY < screenHeight * 0.88 && !triggered.current) {
            triggered.current = true;
            RNAnimated.timing(opacity, {
              toValue: 1, duration: 400, delay: 100, useNativeDriver: true,
            }).start();
          }
        });
      };
      check();
      const id = scrollY.addListener(check);
      return () => scrollY.removeListener(id);
    }, []);

    return (
      <RNAnimated.View
        ref={viewRef}
        style={[styles.timelineConnector, { opacity }]}
      />
    );
  }

  const timelineBlocks = [
    {
      title: "Find Your Fit",
      desc: "Browse weekly and one-time service events that match your availability and the causes you’re most passionate about.",
      img: tmBlock1,
    },
    {
      title: "Sign Up",
      desc: "Register for your chosen event based on the specific service needed and see which of your friends are already going.",
      img: tmBlockMB1,
    },
    {
      title: "Meet Your Crew",
      desc: "Head to the designated meetup point at the scheduled time. We provide rides for off-campus events.",
      img: tmBlockMB2,
    },
    {
      title: "Serve Your Community",
      desc: "Complete your service, earn points for the organizations you belong to, and climb the service leaderboard.",
      img: tmBlock3,
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerShadow}>
        <PublicHeader />
      </View>
      <RNAnimated.ScrollView
        style={styles.container}
        // onScroll={(e) => {
        //   const scrollY = e.nativeEvent.contentOffset.y;

        //   if (!redTriggered.current && scrollY + screenHeight >= redGridY.current) {
        //     redTriggered.current = true;
        //     setShowRedGrid(true);
        //     animateRedGrid();
        //   }

        //   if (!yellowTriggered.current && scrollY + screenHeight >= yellowGridY.current) {
        //     yellowTriggered.current = true;
        //     setShowYellowGrid(true);
        //     animateYellowGrid();
        //   }

        //   if (!numGridTriggered.current && scrollY + screenHeight >= numGridY.current) {
        //     numGridTriggered.current = true;
        //     setShowNumGrid(true);
        //     animateNumGrid();
        //   }
        // }}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header} >
          <Image
            source={require('@/assets/images/backup.jpeg')}
            style={styles.headerImg}
          />
          <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}>
            <LinearGradient
              colors={[ "rgba(0,0,0,0.6)", "transparent" ]}
              start={{ x: 0.5, y: 1 }}
              end={{ x: 0.5, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </View>
          <View style={styles.mainHeader}>
            <Text style={styles.heroTitle}>Show Our{"\n"}Campus Cares</Text>
            <Text style={styles.heroSubtitle}>Meet new friends, support local organizations, and help us build a community we can all be proud of.</Text>
            <Pressable
              onPress={() => router.push(`/(tabs)/OpportunitiesPage`)}
              style={styles.exploreBtn}
            >
              <Text style={styles.exploreBtnTxt}>Explore Opportunities</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.page}>
          <AosView animation="fade" delay={100} scrollY={scrollY}>
            <View style={styles.pageHeaderWrapper}>
              <Text style={styles.pageHeader}>IMPACT ROOTED IN COMMUNITY</Text>
              <Text style={styles.pageSubheader}>In just one semester, we’ve hit the ground running, uniting a passionate community of students to step up, give back, and create real impact across Ithaca.</Text>
            </View>
          </AosView>
          <AosView animation="fade" delay={100} scrollY={scrollY}>
            <View style={styles.slideshowWrapper}>
              <View style={[styles.slideshowContainer, { width: slideWidth }]}>
                <FlatList
                  ref={flatListRef}
                  data={covers}
                  keyExtractor={(_, i) => String(i)}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  decelerationRate='fast'
                  scrollEnabled
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / (slideWidth + 16));
                    setActiveSlide(index);
                    if (slideTimer.current) clearInterval(slideTimer.current);
                    slideTimer.current = setInterval(() => {
                      setActiveSlide((prev) => {
                        const next = (prev + 1) % covers.length;
                        flatListRef.current?.scrollToIndex({ index: next, animated: true });
                        return next;
                      });
                    }, slideInt);
                  }}
                  getItemLayout={(_, index) => ({
                    length: slideWidth,
                    offset: slideWidth * index,
                    index,
                  })}
                  renderItem={({ item }) => (
                    <Image
                      source={item}
                      style={{ width: slideWidth, height: slideHeight }}
                      resizeMode="cover"
                    />
                  )}
                />
                <View style={styles.dots}>
                  {covers.map((_, i) => (
                    <Pressable key={i} onPress={() => goToSlide(i)}>
                      <View style={[styles.dot, i === activeSlide && styles.dotActive]} />
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </AosView>
          <AosView animation="zoom-in" delay={100} scrollY={scrollY}>
            <View style={styles.redGrid}>
              <View style={styles.redLeft}>
                <Text style={styles.gridHeader}>825+</Text>
                <Text style={styles.gridSubheader}>Total hours contributed</Text>
                <Pressable
                  onPress={() => router.push(`/SignUpPage`)}
                  style={styles.requestBtn}
                >
                  <Text style={styles.requestBtnTxt}>Request Volunteers</Text>
                  <MaterialIcons name="arrow-forward" size={20} color="white" />
                </Pressable>
              </View>
              <View style={styles.redLeft}>
                <Image
                  source={heartImg}
                  alt='Student Working'
                  style={styles.heartImg}
                />
              </View>
            </View>
          </AosView>
          <AosView animation="zoom-in" delay={100} scrollY={scrollY}>
            <View style={styles.yellowGrid}>
              <View>
                <Text style={styles.gridHeader}>400+</Text>
                <Text style={styles.gridSubheader}>Total student volunteers</Text>
              </View>
              <View style={styles.avatarRow}>
                <View style={styles.avatarContainer}>
                  <Image source={lee} alt='student pfp' style={styles.avatar}/>
                </View>
                <View style={styles.avatarContainer}>
                  <Image source={grace} alt='student pfp' style={styles.avatar}/>
                </View>
                <View style={styles.avatarContainer}>
                  <Image source={scott} alt='student pfp' style={styles.avatar}/>
                </View>
                <View style={styles.overflowAvatar}>
                  <Text style={styles.avatarTxt}>+400</Text>
                </View>
              </View>
            </View>
          </AosView>
          <AosView animation="fade" delay={100} scrollY={scrollY}>
            <View style={styles.numGrid}>
              <View style={styles.numContainer}>
                <Text style={styles.bigNum}>93</Text>
                <Text style={styles.numDesc}>Volunteer{"\n"}events</Text>
              </View>
              <View style={styles.numContainer}>
                <Text style={styles.bigNum}>10</Text>
                <Text style={styles.numDesc}>Community{"\n"}partners</Text>
              </View>
              <View style={styles.numContainer}>
                <Text style={styles.bigNum}>58</Text>
                <Text style={styles.numDesc}>Student{"\n"}organizations</Text>
              </View>
            </View>
          </AosView>
        </View>
        <AosView animation="fade" delay={100} scrollY={scrollY}>
          <View style={styles.page}>
            <View style={styles.pageHeaderWrapper}>
              <Text style={styles.pageHeader}>OUR COMMUNITY PARTNERS</Text>
              <Text style={styles.pageSubheader}>Explore our network of partners and find an organization whose mission resonates with you.</Text>
            </View>
            <View style={styles.carouselWrapper}>
              <View style={styles.carouselContainer}>
                <Pressable
                  onPress={() => handleScroll("left")}
                  disabled={scrollNum === 0}
                  style={styles.arrowBtn}
                >
                  <MaterialIcons name="keyboard-arrow-left" size={32} color={scrollNum === 0 ? "#9CA3AF" : "#000"} />
                </Pressable>
                <View style={[styles.carouselViewport, { width: carouselCardWidth }]}>
                  <FlatList
                    ref={partnerListRef}
                    data={partners}
                    horizontal
                    pagingEnabled
                    // decelerationRate='fast'
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, i) => String(i)}
                    onMomentumScrollEnd={(e) => {
                      const index = Math.round(
                        e.nativeEvent.contentOffset.x / carouselCardWidth
                      );
                      setScrollNum(index);
                    }}
                    getItemLayout={(_, index) => ({
                      length: carouselCardWidth,
                      offset: carouselCardWidth * index,
                      index,
                    })}
                    renderItem={({ item: partner }) => (
                      <View style={{ width: carouselCardWidth }}>
                        <View style={[styles.partnerImgWrapper, { width: carouselCardWidth }]}>
                          <Image
                            source={ typeof partner.img === "string" ? { uri: partner.img } : partner.img }
                            style={styles.partnerImg}
                            resizeMode="cover"
                          />
                        </View>
                        <View style={styles.tags}>
                          {partner.tags.map((tag: string) => (
                            <View
                              key={tag}
                              style={[ styles.tag, tagStyles[tags[tag] as keyof typeof tagStyles] ]}
                            >
                              <Text style={[ styles.tagTxt, tagTxtStyles[tags[tag] as keyof typeof tagTxtStyles] ]}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                        <View style={styles.subTitle}>
                          <Text style={styles.partnerTitle}>{partner.title}</Text>
                          <Text style={styles.partnerDesc}>{partner.desc}</Text>
                        </View>
                      </View>
                    )}
                  />
                </View>
                <Pressable
                  onPress={() => handleScroll("right")}
                  disabled={scrollNum >= maxScrollSteps}
                  style={[styles.arrowBtn, scrollNum >= maxScrollSteps && styles.disabledArrow ]}
                >
                  <MaterialIcons name="keyboard-arrow-right" size={36} color={scrollNum >= maxScrollSteps ? "#9CA3AF" : "#000"} />
                </Pressable>
              </View>
              <View style={styles.carouselDots}>
                {Array.from({ length: maxScrollSteps + 1 }).map((_, i) => (
                  <View
                    key={i}
                    style={[styles.carouselDot, scrollNum === i && styles.carouselDotActive]}
                  />
                ))}
              </View>
            </View>
          </View>
        </AosView>
        <View style={styles.page}>
          <AosView animation="fade" delay={100} scrollY={scrollY}>
            <View style={styles.header}>
              <Text style={styles.pageHeader}>READY TO MAKE A DIFFERENCE?</Text>
              <Text style={styles.pageSubheader}>Join our community of volunteers and start giving back to the Ithaca community in just four steps.</Text>
            </View>
          </AosView>
          <View style={styles.timeline}>
            <View style={styles.timelineLine}>
              {icons.map((icon, i) => (
                <View key={i} style={styles.circleWrap}>
                  <AosView
                    key={i}
                    animation={'zoom-in'}
                    delay={i * 100}
                    scrollY={scrollY}
                    style={styles.iconCircle}
                  >
                    <Image
                      source={ typeof icon === "string" ? { uri: icon } : icon }
                      style={styles.iconImg}
                      resizeMode="contain"
                    />
                  </AosView>
                  {i !== icons.length - 1 && (
                    <AnimatedConnector scrollY={scrollY} />
                  )}
                </View>
              ))}
            </View>
            <View style={styles.timelineRight}>
              {timelineBlocks.map((block, i) => (
                <AosView
                  key={i}
                  animation={'fade-left'}
                  delay={i * 100}
                  scrollY={scrollY}
                >
                  <View key={i} style={styles.timelineBlock}>
                    <Text style={styles.timelineTitle}>{block.title}</Text>
                    <Text style={styles.timelineText}>{block.desc}</Text>
                    <Image
                      source={block.img}
                      style={styles.timelineImg}
                      resizeMode="contain"
                    />
                  </View>
                </AosView>
              ))}
            </View>
          </View>
        </View>
        <HomeFooter />
      </RNAnimated.ScrollView>
    </View>
  )
}

export default HomePage;

const styles = StyleSheet.create({
  headerShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1,
  },
  container: {
    // padding: 24,
  },
  page: {
    flexDirection: 'column',
  },
  header: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImgWrapper: {
    overflow: "hidden",
  },
  headerImg: {
    width: '100%',
    height: 500,
    resizeMode: 'cover',
  },
  mainHeader: {
    position: 'absolute',
    marginTop: 120,
    padding: 12,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 42,
    letterSpacing: -1,
    color: "white",
    textAlign: "center",
  },
  heroSubtitle: {
    marginVertical: 16,
    fontSize: 22,
    fontWeight: '500',
    color: "white",
    textAlign: "center",
    fontFamily: 'ui-rounded',
  },
  exploreBtn: {
    backgroundColor: Theme.cornellRed,
    width: 250,
    marginTop: 14,
    paddingVertical: 18,
    borderRadius: 999,
    alignSelf: 'center',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  exploreBtnTxt: {
    color: 'rgb(255,255,255)',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  below: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
  },
  pageHeaderWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 12,
    marginHorizontal: 14,
  },
  pageHeader: {
    color: '#B31B1B',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: 'ui-rounded',
    marginBottom: 7,
  },
  pageSubheader: {
    color: '#4B5563',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontFamily: 'ui-rounded',
    marginHorizontal: 4,
  },
  slideshowWrapper: {
    marginTop: 6,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  slideshowContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
    alignSelf: "center",
    flex: 1,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 6,
    backgroundColor: 'white',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#CCCCCC',
  },
  dotActive: {
    backgroundColor: Theme.cornellRed,
    width: 18,
  },
  redGrid: {
    backgroundColor: '#B31B1B',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingTop: 10,
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: "space-between",
  },
  redLeft: {
    flexDirection: 'column',
  },
  gridHeader: {
    color: '#FFF8F8',
    fontSize: 48,
    fontWeight: '800',
    fontFamily: 'ui-rounded',
  },
  gridSubheader: {
    color: '#FFF8F8',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 12,
  },
  redRight: {
    alignItems: "center",
  },
  heartImg: {
    height: 100,
    width: 100,
    resizeMode: 'contain',
  },
  requestBtn: {
    backgroundColor: '#CC5D56',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    gap: 8,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  requestBtnTxt: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  yellowGrid: {
    backgroundColor: '#FAA018',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: "space-between",
  },
  avatarRow: {
    flexDirection: 'row',
    // marginBottom: 28,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: '#FAA018',
    borderRadius: 999,
    marginLeft: -12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 26,
  },
  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  overflowAvatar: {
    width: 40,
    height: 40,
    backgroundColor: '#CD7707',
    borderWidth: 2,
    borderColor: '#FAA018',
    borderRadius: 999,
    marginLeft: -12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTxt: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -1,
    marginLeft: -2,
  },
  numGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginBottom: 18,
    gap: 2,
  },
  numContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    flexDirection: 'column',
    paddingVertical: 8,
    width: '32%'
  },
  bigNum: {
    alignSelf: 'center',
    color: '#B31B1B',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'ui-rounded',
  },
  numDesc: {
    alignSelf: 'center',
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
  carouselWrapper: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  carouselContainer: {
    flexDirection: 'row',
    justifyContent: "center",
    width: '100%',
  },
  carouselViewport: {
    overflow: "hidden",
  },
  partnerImgWrapper: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  partnerImg: {
    width: '100%',
    height: '100%',
  },
  tags: {
    flexDirection: "row",
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  tagTxt: {
    fontSize: 12,
    fontWeight: '600',
  },
  arrowBtn: {
    width: 40,
    alignItems: 'center',
    marginTop: 90,
  },
  disabledArrow: {
    opacity: 0.35,
  },
  subTitle: {
    gap: 4,
    marginTop: 8,
  },
  partnerTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
  },
  partnerDesc: {
    color: '#4B5563',
    fontSize: 14,
  },
  carouselDots: {    
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  carouselDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  carouselDotActive: {
    backgroundColor: Theme.cornellRed,
    width: 18,
  },
  timeline: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
    marginTop: 32,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  timelineLine: {
    alignItems: 'center',
    marginTop: 18,
  },
  circleWrap: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#FAA018',
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconImg: {
    width: 16,
    height: 16,
  },
  timelineConnector: {
    width: 2,
    height: 270,
    backgroundColor: '#D1D5DB',
  },
  timelineRight: {
    flex: 1,
    gap: 24,
  },
  timelineBlock: {
    width: '98%',
    gap: 4,
  },
  timelineTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  timelineText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '400',
  },
  timelineImg: {
    width: '100%',
    height: 180,
  },
});