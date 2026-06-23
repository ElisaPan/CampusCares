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
import helpIcon from '@/assets/icons/help.svg';
import locationIcon from '@/assets/icons/location.svg';
import profileCheckIcon from '@/assets/icons/profile-check.svg';
import searchIcon from '@/assets/icons/search.svg';
import childrensGarden from '@/assets/images/childrens-garden.png';
import cover1 from '@/assets/images/cover1.png';
import cover2 from '@/assets/images/cover2.png';
import cover3 from '@/assets/images/cover3.png';
import heartImg from '@/assets/images/heart-img.png';
import mobilePack from '@/assets/images/mobile-pack.png';
import salvationArmy from '@/assets/images/salvation-army.jpg';
import secondWind from '@/assets/images/second-wind.jpg';
import tmBlockMB1 from '@/assets/images/tm-block-mb1.png';
import tmBlockMB2 from '@/assets/images/tm-block-mb2.png';
import tmBlock1 from '@/assets/images/tm-block1.png';
import tmBlock3 from '@/assets/images/tm-block3.png';
import HomeFooter from '@/components/HomeFooter';
import * as Theme from '@/constants/theme';
import grace from '@/public/team_pic/grace.jpeg';
import lee from '@/public/team_pic/lee.png';
import scott from '@/public/team_pic/scott.png';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, Animated as RNAnimated, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInLeft, ZoomIn } from "react-native-reanimated";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const HomePage = () => {
  const [isVisible, setIsVisible] = useState(true);
  const covers = [cover1, cover2, cover3];
  const [active, setActive] = useState(0);
  const [scrollNum, setScrollNum] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const icons = [searchIcon, profileCheckIcon, locationIcon, helpIcon];
  const [maxScrollSteps, setMaxScrollSteps] = useState(0);
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const translateY = useRef(new RNAnimated.Value(-20)).current;

  const router = useRouter();
  


  const getCardWidth = () => {
    const container = carouselRef.current;
    if (!container) return 0;

    const card = container.querySelector('.partner') as HTMLElement;
    if (!card) return 0;

    const gap = parseInt(getComputedStyle(container).columnGap || '0', 10);
    return card.offsetWidth + gap;
  };

  const calculateMaxScrollSteps = () => {
    const container = carouselRef.current;
    if (!container) return;

    const cardWidth = getCardWidth();
    if (!cardWidth) return;

    const maxScroll =
        container.scrollWidth - container.clientWidth;

    const steps = Math.round(maxScroll / cardWidth);
    setMaxScrollSteps(Math.max(0, steps));
  };

  const handleScroll = (direction: 'left' | 'right') => {
    const container = carouselRef.current;
    if (!container) return;

    const cardWidth = getCardWidth();
    if (!cardWidth) return;

    const delta = direction === 'left' ? -cardWidth : cardWidth;

    container.scrollBy({
        left: delta,
        behavior: 'smooth'
    });
  };

  useEffect(() => {
    fadeAnim.setValue(0);
    translateY.setValue(-20);
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      RNAnimated.timing(translateY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;

    const onScroll = () => {
      const cardWidth = getCardWidth();
      if (!cardWidth) return;

      const index = Math.round(container.scrollLeft / cardWidth);
      setScrollNum(Math.min(index, maxScrollSteps));
    };

    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, [maxScrollSteps]);


  useEffect(() => {
    calculateMaxScrollSteps();

    const handleResize = () => {
      calculateMaxScrollSteps();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    const handleScroll = () => { setIsVisible(window.scrollY === 0) }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % covers.length);
    }, 7000);

    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.page,
          { opacity: fadeAnim, transform: [{ translateY }] },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.mainHeader}>
            <Text>Show Our{"\n"}Campus Cares</Text>
            <Text>Meet new friends, support local organizations, and help us build a community we can all be proud of.</Text>
            <Pressable
              onPress={() => router.push(`../Explore`)}
              style={styles.exploreBtn}
            >
              <Text style={styles.exploreBtnTxt}>Explore Opportunities</Text>
            </Pressable>
          </View>
          <View style={styles.bgSlides}>
            {covers.map((src, i) => (
              <Image
                key={i}
                source={ typeof src === "string" ? { uri: src } : src }
                style={styles.slide}
              />
            ))}
          </View>
        </View>
        <View style={styles.page}>
          <View style={styles.pageHeaderWrapper}>
            <Text style={styles.pageHeader}>IMPACT ROOTED IN COMMUNITY</Text>
            <Text style={styles.pageSubheader}>In just one semester, we’ve hit the ground running, uniting a passionate community of students to step up, give back, and create real impact across Ithaca.</Text>
          </View>
          <View style={styles.impactGrid}>
            <View style={styles.topGrid}>
              <Animated.View
                entering={ZoomIn}
                style={styles.redGrid}
              >
                <View style={styles.redRow}>
                  <View style={styles.redLeft}>
                    <Text style={styles.gridHeader}>475+</Text>
                    <Text style={styles.gridSubheader}>Total hours contributed</Text>
                  </View>
                  <>
                    <Image
                      source={heartImg}
                      alt='Student Working'
                      style={styles.heartImg}
                    />
                  </>
                </View>
                <Pressable
                  onPress={() => router.push(`/SignUpPage`)}
                  style={styles.requestBtn}
                >
                  <Text style={styles.requestBtnTxt}>Request Volunteers</Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#000" />
                </Pressable>
              </Animated.View>
              <Animated.View
                entering={ZoomIn}
                style={styles.yellowGrid}
              >
                <Text style={styles.gridHeader}>350+</Text>
                <Text style={styles.gridSubheader}>Total student volunteers</Text>
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
                  <View style={styles.avatar}>
                    <Text style={styles.avatarTxt}>+350</Text>
                  </View>
                </View>
              </Animated.View>
            </View>
            <View style={styles.bottomGrid}>
              <Animated.View
                entering={FadeIn}
                style={styles.numbersContainer}
              >
                <Text style={styles.bigNum}>93</Text>
                <Text style={styles.numDesc}>Volunteer events</Text>
              </Animated.View>
              <Animated.View
                entering={FadeIn}
                style={styles.numbersContainer}
              >
                <Text style={styles.bigNum}>10</Text>
                <Text style={styles.numDesc}>Community partners uplited</Text>
              </Animated.View>
              <Animated.View
                entering={FadeIn}
                style={styles.numbersContainer}
              >
                <Text style={styles.bigNum}>49</Text>
                <Text style={styles.numDesc}>Student organizations</Text>
              </Animated.View>
            </View>
          </View>
        </View>
        <View style={styles.page}>
          <View style={styles.pageHeaderWrapper}>
            <Text style={styles.pageHeader}>OUR COMMUNITY PARTNERS</Text>
            <Text style={styles.pageSubheader}>Explore our network of partners and find an organization whose mission resonates with you.</Text>
          </View>
          <View style={styles.carouselContainer}>
            <View style={styles.carouselWrapper}>
              <Pressable
                onPress={() => handleScroll("left")}
                disabled={scrollNum === 0}
              >
                <MaterialIcons name="keyboard-arrow-left" size={32} color={scrollNum === 0 ? "#9CA3AF" : "#000"} />
              </Pressable>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.partners} >
                {partners.map((partner, i) => (
                  <View key={i} style={styles.partner}>
                    <Image
                      source={ typeof partner.img === "string" ? { uri: partner.img } : partner.img }
                      style={styles.partnerImg}
                      resizeMode="cover"
                    />
                    <View style={styles.tags}>
                      {partner.tags.map((tag) => (
                        <View
                          key={tag}
                          style={[ styles.tag, styles[tags[tag] as keyof typeof styles] ]}
                        >
                          <Text style={styles.tagTxt}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.subTitle}>
                      <Text style={styles.partnerTitle}>{partner.title}</Text>
                      <Text style={styles.partnerDesc}>{partner.desc}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <Pressable
                onPress={() => handleScroll("right")}
                disabled={scrollNum >= maxScrollSteps}
              >
                <MaterialIcons name="keyboard-arrow-right" size={36} color={scrollNum >= maxScrollSteps ? "#9CA3AF" : "#000"} />
              </Pressable>
            </View>
            <View style={styles.scrollIndicators}>
              {Array.from({ length: maxScrollSteps + 1 }).map((_, i) => (
                <View
                  key={i}
                  style={styles.scrollCircle}
                />
              ))}
            </View>
          </View>
        </View>
        <View style={styles.page}>
          <Animated.View
            entering={FadeIn}
            style={styles.header}
          >
            <Text>READY TO MAKE A DIFFERENCE?</Text>
            <Text>Join our community of volunteers and start giving back to the Ithaca community in just four steps.</Text>
          </Animated.View>
          <View style={styles.timeline}>
            <View style={styles.timelineLine}>
              {icons.map((icon, i) => (
                <View key={i} style={styles.circleWrap}>
                  <Animated.View
                    entering={ZoomIn}
                    style={styles.iconCircle}
                  >
                    <Image
                      source={ typeof icon === "string" ? { uri: icon } : icon }
                      style={styles.iconImg}
                      resizeMode="contain"
                    />
                  </Animated.View>
                  {i !== icons.length - 1 && (
                    <View style={styles.connector} />
                  )}
                </View>
              ))}
            </View>
            <View style={styles.timelineRight}>
              <Animated.View
                entering={FadeInLeft}
                style={styles.timelineBlock}
              >
                <Text>Find Your Fit</Text>
                <Text>Browse weekly and one-time service events that match your availability and the causes you’re most passionate about.</Text>
                <Image source={tmBlock1} />
              </Animated.View>
              <Animated.View
                entering={FadeInLeft}
                style={styles.timelineBlock}
              >
                <Text>Sign Up</Text>
                <Text>Register for your chosen event based on the specific service needed and see which of your friends are already going.</Text>
                <Image source={tmBlockMB1} />
              </Animated.View>
              <Animated.View
                entering={FadeInLeft}
                style={styles.timelineBlock}
              >
                <Text>Meet Your Crew</Text>
                <Text>Head to the designated meetup point at the scheduled time. We provide rides for off-campus events.</Text>
                <Image source={tmBlockMB2} />
              </Animated.View>
              <Animated.View
                entering={FadeInLeft}
                style={styles.timelineBlock}
              >
                <Text>Serve Your Community</Text>
                <Text>Complete your service, earn points for the organizations you belong to, and climb the service leaderboard.</Text>
                <Image source={tmBlock3} />
              </Animated.View>
            </View>
          </View>
        </View>
        <HomeFooter />
      </Animated.View>
    </View>
  )
}

export default HomePage;

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  page: {
    flexDirection: 'column',
    overflowX: 'hidden',
  },
  header: {
    height: 200,
    width: '100%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  mainHeader: {
    zIndex: 2,
    paddingVertical: 8,
    paddingHorizontal: 10,
    textAlign: 'center',
    color: 'white',
  },
  exploreBtn: {
    backgroundColor: Theme.cornellRed,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  exploreBtnTxt: {
    color: 'white',
    fontWeight: '600',
  },
  bgSlides: {
    position: 'absolute',
    overflow: 'hidden',
  },
  slide: {
    position: 'absolute',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  pageHeaderWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  pageHeader: {
    color: '#B31B1B',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 28,
  },
  pageSubheader: {
    color: '#4B5563',
    fontSize: 8,
    textAlign: 'center',
  },
  impactGrid: {
    flexDirection: 'column',
    gap: 20,
    width: '100%',
  },
  topGrid: {

  },
  bottomGrid: {
    flexDirection: 'row',
    gap: 20,
    width: '100%',
  },
  redGrid: {
    borderRadius: 16,
    paddingVertical: 60,
    paddingHorizontal: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B31B1B',
    flexDirection: 'column',
    gap: 20,
  },
  yellowGrid: {
    borderRadius: 16,
    paddingVertical: 60,
    paddingHorizontal: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAA018',
    flexDirection: 'column',
    gap: 20,
  },
  redRow: {
    flexDirection: 'row',
    gap: 20,
  },
  redLeft: {
    flexDirection: 'column',
  },
  gridHeader: {
    color: '#FFF8F8',
    fontSize: 60,
    fontWeight: 700,
  },
  gridSubheader: {
    color: '#FFF8F8',
    fontSize: 16,
    fontWeight: '400',
  },
  heartImg: {
    height: 200,
    objectFit: 'scale-down',
  },
  requestBtn: {
    backgroundColor: '#CC5D56',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  avatarRow: {
    flexDirection: 'row',
    marginTop: 24,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: '#FAA018',
    borderRadius: 4,
    marginLeft: -12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarTxt: {
    color: 'white',
    fontSize: 12,
    letterSpacing: -2,
  },
  numbersContainer: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    flexDirection: 'column',
    paddingVertical: 20,
    paddingHorizontal: 50,
  },
  bigNum: {
    color: '#B31B1B',
    fontSize: 24,
    fontWeight: '700',
  },
  numDesc: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  carouselContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  carouselWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    position: 'relative',
  },
  partners: {
    flexDirection: 'row',
    gap: 20,
    width: '100%',
    overflow: 'hidden',
  },
  partner: {
    flexDirection: 'column',
    gap: 12,
    width: 320,
  },
  partnerImg: {
    width: 320,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  tags: {
    gap: 8,
    flexWrap: 'wrap',
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
  subTitle: {
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 16,
  },
  partnerTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  partnerDesc: {
    color: '#4B5563',
    fontSize: 14,
  },
  scrollIndicators: {
    gap: 8,
  },
  scrollCircle: {
    height: 8,
    width: 8,
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
  },
  timeline: {
    flexDirection: 'row',
    gap: 40,
    alignItems: 'center',
    marginTop: 25,
  },
  timelineLine: {

  },
  circleWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAA018',
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconImg: {
    width: 16,
  },
  connector: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    height: 250,
    width: 2,
  },
  timelineRight: {
    flexDirection: 'column',
    gap: 150,
  },
  timelineBlock: {
    width: 440,
    overflow: 'hidden',
    flexDirection: 'column',
    gap: 10,
  },
});