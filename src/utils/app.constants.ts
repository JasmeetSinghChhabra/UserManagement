export class Constants {
  public static get DATE_FMT(): string { return "MM/dd/yyyy"; }
  public static get DATE_TIME_FMT(): string { return `${Constants.DATE_FMT} hh:mm:ss`; }   
  public static get DATE_FMT_LIST(): string { return "MMM dd"; }
  public static get DATE_HOUR(): string { return "hh:mm a"; }
}