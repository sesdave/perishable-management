export const convertEpochMillisecondsToDatetime = (milliseconds: number | undefined): string | null =>{
    if (milliseconds === undefined || isNaN(milliseconds)) {
      return null; 
    }
    if (milliseconds < Number.MIN_SAFE_INTEGER || milliseconds > Number.MAX_SAFE_INTEGER) {
      throw new Error('Timestamp is outside the valid range for the Date!!!');
    }
  
    let millisecondsString = milliseconds.toString();
    // Add trailing zeros to milliseconds if they are less than 13 digits
    while (millisecondsString.length < 13) {
      millisecondsString += '0';
    }
  
    const date = new Date(parseInt(millisecondsString)); // Convert back to a number
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-indexed
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
  
    const formattedDatetime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return formattedDatetime;
  }