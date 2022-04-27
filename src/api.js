import axios from "axios";

const contextMainDataUrl =
  "https://raw.githubusercontent.com/denbon05/data/main/";
const contextDataUrl = new URL("yourcodereview.json", contextMainDataUrl);

const companies = new Map();
const segments = new Map();

export const loadContextData = async () => {
  const {
    data: { tickets, companies: companiesList, segments: segmentsList },
  } = await axios.get(contextDataUrl.toString());

  companiesList.forEach((company) => {
    companies.set(company.id, company);
  });
  segmentsList.forEach((segment) => {
    segments.set(segment.id, segment);
  });

  return { companies, tickets, segments };
};
