import { useLocalSearchParams } from "expo-router";
import OpportunityDetailPage from "../(tabs)/OpportunityDetailPage";

export default function OpportunityRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OpportunityDetailPage key={id} id={id} />;
}