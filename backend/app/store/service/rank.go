package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/umputun/remark42/backend/app/store"
	"github.com/umputun/remark42/backend/app/store/engine"
)

type RankingRequest struct {
	ID   string `json:"id"`
	Text string `json:"text"`
}

type RankingResponse struct {
	RankedIDs    map[string]int `json:"ranked_ids"`
	WarningIndex int            `json:"warning_index"`
}

func rank(rankerUrl string, engineInstance engine.Interface, locator store.Locator) {
	engineRequest := engine.FindRequest{Locator: locator, Sort: "time", Since: time.Time{}}
	comments, err := engineInstance.Find(engineRequest)
	if err != nil {
		fmt.Println("error finding comments")
		return
	}

	var rankingRequest []RankingRequest
	for _, comment := range comments {
		rankingRequest = append(rankingRequest, RankingRequest{
			ID:   comment.ID,
			Text: comment.Text,
		})
	}
	// Add the comments to a JSON object
	jsonData := map[string]interface{}{
		"comments": rankingRequest,
	}
	fmt.Println("Sending ranking requests to remote server")
	rankingRequestsJSON, err := json.Marshal(jsonData)
	if err != nil {
		fmt.Println("Error marshaling JSON:", err)
		return
	} else {
		fmt.Println("Ranking requests JSON:", string(rankingRequestsJSON))
	}

	// Create a new POST request with the JSON data
	req, err := http.NewRequest("POST", rankerUrl, bytes.NewBuffer(rankingRequestsJSON))
	if err != nil {
		fmt.Println("Error creating request:", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error sending request:", err)
		return
	}
	defer resp.Body.Close()

	// Handle the response
	if resp.StatusCode == http.StatusOK {
		fmt.Println("Request successful")
	} else {
		fmt.Printf("Request failed with status code: %d\n", resp.StatusCode)
		return
	}
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Error reading response body:", err)
		return
	}

	bodyString := string(bodyBytes)
	fmt.Println("Ranking requests JSON:", bodyString)

	var result RankingResponse
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		// Handle error, default to local rank comparison
		fmt.Println("Error unmarshaling:", err)
		return
	}

	for i := range comments {
		id := comments[i].ID
		rank := result.RankedIDs[id]
		comments[i].Rank = rank
		if rank == result.WarningIndex {
			fmt.Println("Warning index:", result.WarningIndex)
			fmt.Println("Warning comment:", comments[i])
		}
	}

	engineInstance.SetScrollWarning(locator, result.WarningIndex)

	for _, comment := range comments {
		err = engineInstance.Update(comment)
		if err != nil {
			fmt.Println("error updating comment")
			fmt.Println(err)
		}
	}
}
