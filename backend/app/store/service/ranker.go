package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/umputun/remark42/backend/app/store"
)

type RankingRequest struct {
	ID        string `json:"id"`
	ParentID  string `json:"parent_id"`
	PostTitle string `json:"title"`
	Text      string `json:"text"`
}

type RankingResponse struct {
	RankedIDs    map[string]int `json:"ranked_ids"`
	WarningIndex int            `json:"warning_index"`
}

func rank(comments []store.Comment) []store.Comment {
	var rankingRequest []RankingRequest
	for _, comment := range comments {
		if comment.ParentID == "" {
			rankingRequest = append(rankingRequest, RankingRequest{
				ID:        comment.ID,
				ParentID:  comment.ParentID,
				PostTitle: comment.PostTitle,
				Text:      comment.Text,
			})
		}
	}
	// Add the comments to a JSON object
	jsonData := map[string]interface{}{
		"comments": rankingRequest,
	}
	fmt.Println("Sending ranking requests to remote server")
	// Marshal the rankingRequests to JSON
	rankingRequestsJSON, err := json.Marshal(jsonData)
	if err != nil {
		fmt.Println("Error marshaling JSON:", err)
	} else {
		fmt.Println("Ranking requests JSON:", string(rankingRequestsJSON))
	}

	// Create a new POST request with the JSON data
	url := "http://civirank:8000/rank_comments"
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(rankingRequestsJSON))
	if err != nil {
		fmt.Println("Error creating request:", err)
	}

	// Set the appropriate headers
	req.Header.Set("Content-Type", "application/json")

	// Send the request using http.Client
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error sending request:", err)
	}
	defer resp.Body.Close()

	// Handle the response
	if resp.StatusCode == http.StatusOK {
		fmt.Println("Request successful")
	} else {
		fmt.Printf("Request failed with status code: %d\n", resp.StatusCode)
	}

	// Read the response body
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Error reading response body:", err)
	}

	bodyString := string(bodyBytes)
	fmt.Println("Ranking requests JSON:", bodyString)
	// Parse the response
	var result RankingResponse
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		// Handle error, default to local rank comparison
		fmt.Println("Error unmarshaling:", err)
	}

	for i := range comments {
		id := comments[i].ID
		rank := result.RankedIDs[id]
		comments[i].Rank = rank
		if rank == result.WarningIndex {
			fmt.Println("Warning index:", result.WarningIndex)
			fmt.Println("Warning comment:", comments[i])
			comments[i].Warning = true
		} else {
			comments[i].Warning = false
		}
	}
	return comments
}
