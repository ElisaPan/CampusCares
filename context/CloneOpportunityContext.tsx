import { Opportunity } from "@/types";
import React, { createContext, useContext, useState } from "react";

type CloneOpportunityData = Partial<Opportunity>;

type CloneOpportunityContextType = {
  clonedOpportunityData: CloneOpportunityData | null;
  setClonedOpportunityData: (data: CloneOpportunityData | null) => void;
};

const CloneOpportunityContext =
  createContext<CloneOpportunityContextType | null>(null);

export function CloneOpportunityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [clonedOpportunityData, setClonedOpportunityData] =
    useState<CloneOpportunityData | null>(null);

  return (
    <CloneOpportunityContext.Provider
      value={{
        clonedOpportunityData,
        setClonedOpportunityData,
      }}
    >
      {children}
    </CloneOpportunityContext.Provider>
  );
}

export function useCloneOpportunity() {
  const context = useContext(CloneOpportunityContext);

  if (!context) {
    throw new Error(
      "useCloneOpportunity must be used inside CloneOpportunityProvider"
    );
  }

  return context;
}