import axios from "axios";
import moment from "moment";

const contextMainDataUrl =
  "https://raw.githubusercontent.com/denbon05/data/main/";
const contextDataUrl = new URL("yourcodereview.json", contextMainDataUrl);

const companies = new Map();
// const segments = new Map();

export const loadContextData = async () => {
  const {
    data: { tickets, companies: companiesList, segments },
  } = await axios.get(contextDataUrl.toString());

  // segmentsList.forEach((segment) => {
  //   segments.set(segment.id, segment);
  // });

  companiesList.forEach((company) => {
    companies.set(company.id, company);
  });

  segments.forEach((segment) => {
    const { dateStart, dateEnd, duration } = segment;
    segment.dateStart = moment(dateStart).format("HH:MM");
    segment.dateEnd = moment(dateEnd).format("HH:MM");
    segment.duration = moment(duration).format("HH:MM");
    // segments.set(segment);
  });
  // console.log([...segments].at(0));

  return { companies, tickets, segments };
};
